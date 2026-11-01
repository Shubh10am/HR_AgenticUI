// Server-only: reads and decrypts organization API keys. Never import from a client component.
import { createHash } from 'node:crypto';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { anthropic } from '@genkit-ai/anthropic';
import { openAICompatible } from '@genkit-ai/compat-oai';
import dbConnect from '@/lib/mongodb';
import { decrypt } from '@/lib/encryption';
import { verifyToken } from '@/lib/jwt';
import { checkPublicHttpsUrl } from '@/lib/safe-url';
import Organization from '@/models/Organization';
import { ai } from '@/ai/genkit';
import { CHAT_MODEL } from '@/ai/models';
import { getProvider, type AiProviderId } from '@/ai/providers';

type Runner = typeof ai;

export interface ResolvedAiConfig {
  provider: AiProviderId;
  model: string;
  apiKey: string | null;
  baseURL?: string;
  /** "organization" when the org brought its own key; "platform" when the shared key is used. */
  source: 'organization' | 'platform';
}

export interface AiContext {
  runner: Runner;
  /** Fully-qualified Genkit model name, e.g. "anthropic/claude-sonnet-5-5". */
  model: string;
  provider: AiProviderId;
  userId: string | null;
  organizationId: string | null;
}

const PLATFORM_CONFIG: ResolvedAiConfig = { provider: 'google', model: CHAT_MODEL.replace(/^googleai\//, ''), apiKey: null, source: 'platform' };

/** Genkit instances are relatively costly to build, so one is kept per distinct provider/key/endpoint. */
const RUNNER_CACHE_LIMIT = 50;
const runnerCache = new Map<string, Runner>();

function cacheKey(config: ResolvedAiConfig): string {
  return createHash('sha256').update(`${config.provider}|${config.baseURL ?? ''}|${config.apiKey ?? ''}`).digest('hex');
}

/** The Genkit model name for a provider and model ID. */
export function qualifiedModelName(provider: AiProviderId, model: string): string {
  if (provider === 'google') return `googleai/${model}`;
  if (provider === 'anthropic') return `anthropic/${model}`;
  return `${provider}/${model}`;
}

/**
 * A Genkit instance for one provider configuration.
 *
 * @throws When a custom endpoint no longer passes the public-address check.
 */
export async function buildRunner(config: ResolvedAiConfig): Promise<Runner> {
  if (config.source === 'platform' && config.provider === 'google') return ai;

  const key = cacheKey(config);
  const cached = runnerCache.get(key);
  if (cached) return cached;

  const definition = getProvider(config.provider);
  if (!definition) throw new Error(`Unknown AI provider "${config.provider}".`);

  let plugin;
  if (definition.kind === 'google') {
    plugin = googleAI({ apiKey: config.apiKey ?? undefined });
  } else if (definition.kind === 'anthropic') {
    plugin = anthropic({ apiKey: config.apiKey ?? undefined });
  } else {
    const baseURL = definition.id === 'custom' ? config.baseURL : definition.baseURL;
    if (!baseURL) throw new Error('This AI provider has no endpoint configured.');
    // Re-checked at use time too, in case the host now resolves somewhere private.
    if (definition.id === 'custom') {
      const problem = await checkPublicHttpsUrl(baseURL);
      if (problem) throw new Error(`Custom AI endpoint rejected: ${problem}`);
    }
    plugin = openAICompatible({ name: definition.id, apiKey: config.apiKey ?? false, baseURL, timeout: 60_000, maxRetries: 1 });
  }

  const runner = genkit({ plugins: [plugin] }) as unknown as Runner;
  if (runnerCache.size >= RUNNER_CACHE_LIMIT) runnerCache.delete(runnerCache.keys().next().value!);
  runnerCache.set(key, runner);
  return runner;
}

/**
 * The AI configuration an organization uses: its own provider when one is
 * saved, else its legacy Google key, else the platform's Gemini key.
 */
export async function getOrganizationAiConfig(organizationId: string | null): Promise<ResolvedAiConfig> {
  if (!organizationId) return PLATFORM_CONFIG;
  await dbConnect();
  const organization = await Organization.findById(organizationId).select('aiConfig encryptedGoogleApiKey').lean();
  if (!organization) return PLATFORM_CONFIG;

  const saved = organization.aiConfig;
  if (saved?.provider && saved.model && getProvider(saved.provider)) {
    const apiKey = saved.encryptedApiKey ? decrypt(saved.encryptedApiKey) : null;
    if (saved.encryptedApiKey && !apiKey) throw new Error('The organization AI key could not be decrypted. An admin needs to re-enter it in Settings.');
    return { provider: saved.provider as AiProviderId, model: saved.model, apiKey, baseURL: saved.baseURL, source: 'organization' };
  }

  if (organization.encryptedGoogleApiKey) {
    const apiKey = decrypt(organization.encryptedGoogleApiKey);
    if (apiKey) return { ...PLATFORM_CONFIG, apiKey, source: 'organization' };
  }
  return PLATFORM_CONFIG;
}

/**
 * Everything an AI flow needs, from the caller's sign-in token. The organization,
 * user and key all come from the verified token — never from values the browser sends.
 * Guest and signed-out sessions use the platform key and are not attributed.
 *
 * @throws When the token is invalid or expired.
 */
export async function resolveAiContext(authToken: string | null | undefined): Promise<AiContext> {
  if (!authToken || authToken.startsWith('guest-')) {
    return { runner: ai, model: CHAT_MODEL, provider: 'google', userId: null, organizationId: null };
  }
  const payload = verifyToken(authToken);
  if (!payload) throw new Error('Your session has expired. Please sign in again.');

  const config = await getOrganizationAiConfig(payload.organizationId);
  return {
    runner: await buildRunner(config),
    model: qualifiedModelName(config.provider, config.model),
    provider: config.provider,
    userId: payload.employeeId,
    organizationId: payload.organizationId,
  };
}

/** For server routes that already verified the caller (e.g. the knowledge base). */
export async function resolveAiForOrganization(organizationId: string): Promise<{ runner: Runner; model: string }> {
  const config = await getOrganizationAiConfig(organizationId);
  return { runner: await buildRunner(config), model: qualifiedModelName(config.provider, config.model) };
}
