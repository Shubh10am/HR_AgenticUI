import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { ai } from '@/ai/genkit';
import Organization from '@/models/Organization';
import { decrypt } from '@/lib/encryption';

// text-embedding-004 was retired by Google (404); gemini-embedding-001 replaces it.
export const EMBEDDER = 'googleai/gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 768;
const EMBED_BATCH_SIZE = 50;

/** Documents and queries are embedded differently; matching the task type sharpens relevance. */
export type EmbeddingTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

type Runner = typeof ai;

/**
 * Returns a Genkit instance for embeddings. Embeddings always use Gemini, so
 * stored vectors stay comparable whichever chat provider the organization picks:
 * the organization's own Google key when Gemini is its provider (or it has the
 * legacy Google key), otherwise the platform key. Keys are read server-side only.
 *
 * @param organizationId - The caller's organization, from the verified token.
 * @returns A Genkit runner with the Google plugin.
 */
export async function getRunnerForOrganization(organizationId: string): Promise<Runner> {
  const organization = await Organization.findById(organizationId).select('encryptedGoogleApiKey aiConfig').lean();
  const encryptedKey = organization?.aiConfig?.provider === 'google'
    ? organization.aiConfig.encryptedApiKey
    : organization?.encryptedGoogleApiKey;
  const apiKey = encryptedKey ? decrypt(encryptedKey) : null;
  return apiKey ? (genkit({ plugins: [googleAI({ apiKey })] }) as unknown as Runner) : ai;
}

/**
 * Embeds passages in batches.
 *
 * @param runner - Genkit runner from {@link getRunnerForOrganization}.
 * @param texts - Passages to embed.
 * @param taskType - Whether the texts are stored documents or a search query.
 * @returns One vector per input, in order.
 * @throws When the embedding service fails.
 */
export async function embedTexts(runner: Runner, texts: string[], taskType: EmbeddingTask): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBED_BATCH_SIZE);
    const result = await runner.embedMany({
      embedder: EMBEDDER,
      content: batch,
      options: { outputDimensionality: EMBEDDING_DIMENSIONS, taskType },
    });
    vectors.push(...result.map((item) => item.embedding));
  }
  return vectors;
}
