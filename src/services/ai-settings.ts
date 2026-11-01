import dbConnect from '@/lib/mongodb';
import { decrypt, encrypt } from '@/lib/encryption';
import { checkPublicHttpsUrl } from '@/lib/safe-url';
import Organization from '@/models/Organization';
import { getProvider, type AiProviderId } from '@/ai/providers';
import { buildRunner, qualifiedModelName, type ResolvedAiConfig } from '@/ai/runtime';

const MODEL_ID = /^[\w.:/@-]{1,120}$/;
const TEST_TIMEOUT_MS = 30_000;

export interface AiSettingsView {
  provider: AiProviderId;
  model: string;
  baseURL: string | null;
  /** Last four characters only — the key itself never leaves the server. */
  keyHint: string | null;
  source: 'organization' | 'legacy-google' | 'platform';
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface AiSettingsInput {
  provider?: unknown;
  model?: unknown;
  apiKey?: unknown;
  baseURL?: unknown;
}

const hint = (key: string | null) => (key && key.length > 8 ? `…${key.slice(-4)}` : key ? '…' : null);

/** What the organization uses now, safe to send to any member of it. */
export async function getAiSettingsView(organizationId: string): Promise<AiSettingsView> {
  await dbConnect();
  const organization = await Organization.findById(organizationId).select('aiConfig encryptedGoogleApiKey').lean();
  const saved = organization?.aiConfig;
  if (saved?.provider && getProvider(saved.provider)) {
    return {
      provider: saved.provider as AiProviderId,
      model: saved.model,
      baseURL: saved.baseURL ?? null,
      keyHint: saved.encryptedApiKey ? hint(decrypt(saved.encryptedApiKey)) : null,
      source: 'organization',
      updatedBy: saved.updatedBy ?? null,
      updatedAt: saved.updatedAt ? new Date(saved.updatedAt).toISOString() : null,
    };
  }
  const legacyKey = organization?.encryptedGoogleApiKey ? decrypt(organization.encryptedGoogleApiKey) : null;
  return {
    provider: 'google',
    model: getProvider('google')!.defaultModel,
    baseURL: null,
    keyHint: hint(legacyKey),
    source: legacyKey ? 'legacy-google' : 'platform',
    updatedBy: null,
    updatedAt: null,
  };
}

/**
 * Validates an admin's submission into a usable configuration. A blank key on the
 * same provider keeps the stored key, so admins can change the model without re-typing it.
 *
 * @returns The configuration, or an error message.
 */
export async function parseAiSettings(organizationId: string, input: AiSettingsInput): Promise<{ config?: ResolvedAiConfig; error?: string }> {
  const definition = getProvider(typeof input.provider === 'string' ? input.provider : null);
  if (!definition) return { error: 'Choose an AI provider.' };

  const model = typeof input.model === 'string' ? input.model.trim() : '';
  if (!MODEL_ID.test(model)) return { error: 'Enter a model ID, for example ' + (definition.defaultModel || 'gpt-4o-mini') + '.' };

  let baseURL: string | undefined;
  if (definition.id === 'custom') {
    baseURL = typeof input.baseURL === 'string' ? input.baseURL.trim().replace(/\/+$/, '') : '';
    const problem = await checkPublicHttpsUrl(baseURL);
    if (problem) return { error: problem };
  }

  let apiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : '';
  if (apiKey.length > 500) return { error: 'That API key is too long.' };
  if (!apiKey) {
    await dbConnect();
    const organization = await Organization.findById(organizationId).select('aiConfig encryptedGoogleApiKey').lean();
    const saved = organization?.aiConfig;
    const reusable = saved?.provider === definition.id ? saved.encryptedApiKey : definition.id === 'google' ? organization?.encryptedGoogleApiKey : undefined;
    apiKey = reusable ? decrypt(reusable) ?? '' : '';
  }
  if (!apiKey) return { error: `Enter your ${definition.label} API key.` };

  return { config: { provider: definition.id, model, apiKey, baseURL, source: 'organization' } };
}

/**
 * Sends a one-word prompt to check the key, model and endpoint all work.
 *
 * @returns Round-trip time, or the provider's error message.
 */
export async function testAiConfig(config: ResolvedAiConfig): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const started = Date.now();
  try {
    const runner = await buildRunner(config);
    const response = await Promise.race([
      runner.generate({ model: qualifiedModelName(config.provider, config.model), prompt: 'Reply with the single word: OK', config: { maxOutputTokens: 20 } }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The provider did not answer within 30 seconds.')), TEST_TIMEOUT_MS)),
    ]);
    return { ok: true, latencyMs: Date.now() - started, message: `Connected. The model replied: “${response.text.trim().slice(0, 40)}”` };
  } catch (error) {
    // Provider errors can echo request details; keep the message short and never include the key.
    const message = (error instanceof Error ? error.message : String(error)).replaceAll(config.apiKey ?? '\u0000', '[key]').slice(0, 300);
    return { ok: false, latencyMs: Date.now() - started, message };
  }
}

/** Saves the configuration with the key encrypted. */
export async function saveAiSettings(organizationId: string, config: ResolvedAiConfig, updatedBy: string): Promise<void> {
  const encryptedApiKey = config.apiKey ? encrypt(config.apiKey) : null;
  if (config.apiKey && !encryptedApiKey) throw new Error('The API key could not be encrypted. Check ENCRYPTION_KEY on the server.');
  await dbConnect();
  await Organization.updateOne(
    { _id: organizationId },
    {
      $set: {
        aiConfig: {
          provider: config.provider,
          model: config.model,
          ...(config.baseURL ? { baseURL: config.baseURL } : {}),
          ...(encryptedApiKey ? { encryptedApiKey } : {}),
          updatedBy,
          updatedAt: new Date(),
        },
      },
      // The legacy single Google key is superseded by aiConfig.
      $unset: { encryptedGoogleApiKey: '' },
    }
  );
}

/** Removes the organization's own provider and key; AI falls back to the platform's Gemini key. */
export async function resetAiSettings(organizationId: string): Promise<void> {
  await dbConnect();
  await Organization.updateOne({ _id: organizationId }, { $unset: { aiConfig: '', encryptedGoogleApiKey: '' } });
}
