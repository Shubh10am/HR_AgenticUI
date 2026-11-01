// This file is NOT 'use server' — it is a plain catalogue, safe to import in the browser. It holds no secrets.

/** How the server talks to a provider. */
export type ProviderKind = 'google' | 'anthropic' | 'openai-compatible';

export type AiProviderId =
  | 'google'
  | 'anthropic'
  | 'openai'
  | 'xai'
  | 'qwen'
  | 'deepseek'
  | 'mistral'
  | 'groq'
  | 'openrouter'
  | 'custom';

export interface AiProviderDefinition {
  id: AiProviderId;
  label: string;
  vendor: string;
  kind: ProviderKind;
  /** OpenAI-compatible endpoint; absent for native plugins and for "custom", where the admin supplies it. */
  baseURL?: string;
  defaultModel: string;
  /** Suggestions only — any model ID the provider offers can be typed in. */
  suggestedModels: string[];
  keyPlaceholder: string;
  keyUrl: string;
}

/**
 * Every provider an organization can bring its own key for. Model lists are
 * suggestions: providers rename models often, so the settings screen accepts
 * any model ID and "Test connection" confirms it works.
 */
export const AI_PROVIDERS: AiProviderDefinition[] = [
  {
    id: 'google', label: 'Google Gemini', vendor: 'Google', kind: 'google',
    defaultModel: 'gemini-flash-latest', suggestedModels: ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-flash-lite-latest'],
    keyPlaceholder: 'AIza…', keyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'anthropic', label: 'Anthropic Claude', vendor: 'Anthropic', kind: 'anthropic',
    defaultModel: 'claude-sonnet-5-5', suggestedModels: ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-5-5'],
    keyPlaceholder: 'sk-ant-…', keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai', label: 'OpenAI', vendor: 'OpenAI', kind: 'openai-compatible', baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini', suggestedModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini'],
    keyPlaceholder: 'sk-…', keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'xai', label: 'xAI Grok', vendor: 'xAI', kind: 'openai-compatible', baseURL: 'https://api.x.ai/v1',
    defaultModel: 'grok-3-mini', suggestedModels: ['grok-3-mini', 'grok-3', 'grok-4'],
    keyPlaceholder: 'xai-…', keyUrl: 'https://console.x.ai',
  },
  {
    id: 'qwen', label: 'Alibaba Qwen', vendor: 'Alibaba Cloud (Model Studio)', kind: 'openai-compatible', baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus', suggestedModels: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    keyPlaceholder: 'sk-…', keyUrl: 'https://modelstudio.console.alibabacloud.com',
  },
  {
    id: 'deepseek', label: 'DeepSeek', vendor: 'DeepSeek', kind: 'openai-compatible', baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat', suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
    keyPlaceholder: 'sk-…', keyUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'mistral', label: 'Mistral AI', vendor: 'Mistral AI', kind: 'openai-compatible', baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest', suggestedModels: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'],
    keyPlaceholder: 'Your Mistral key', keyUrl: 'https://console.mistral.ai/api-keys',
  },
  {
    id: 'groq', label: 'Groq', vendor: 'Groq', kind: 'openai-compatible', baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile', suggestedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    keyPlaceholder: 'gsk_…', keyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter', label: 'OpenRouter', vendor: 'OpenRouter (many models, one key)', kind: 'openai-compatible', baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini', suggestedModels: ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-4.5', 'meta-llama/llama-3.3-70b-instruct', 'qwen/qwen-2.5-72b-instruct'],
    keyPlaceholder: 'sk-or-…', keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'custom', label: 'Other (OpenAI-compatible)', vendor: 'Any OpenAI-compatible API', kind: 'openai-compatible',
    defaultModel: '', suggestedModels: [],
    keyPlaceholder: 'API key', keyUrl: '',
  },
];

const BY_ID = new Map(AI_PROVIDERS.map((provider) => [provider.id, provider]));

export function getProvider(id: string | null | undefined): AiProviderDefinition | undefined {
  return id ? BY_ID.get(id as AiProviderId) : undefined;
}

/** What an organization uses when it hasn't configured anything: the platform's own Gemini key. */
export const DEFAULT_PROVIDER: AiProviderId = 'google';
