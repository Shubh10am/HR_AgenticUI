import KnowledgeChunk from '@/models/KnowledgeChunk';
import KnowledgeItem from '@/models/KnowledgeItem';
import CompanyPolicy from '@/models/CompanyPolicy';
import { chunkText, cosineSimilarity } from './chunking';
import { embedTexts, getRunnerForOrganization } from './embeddings';

export interface KnowledgePassage {
  /** Document id, or `policy:<type>` for a built-in company policy. */
  sourceId: string;
  sourceName: string;
  text: string;
  score: number;
}

const POLICY_NAMES: Record<string, string> = {
  attendance: 'Attendance Policy',
  leave: 'Leave Policy',
  codeOfConduct: 'Code of Conduct',
};
const MAX_CANDIDATE_CHUNKS = 5000;
// Measured on gemini-embedding-001 (768-d): relevant passages score ~0.69–0.76, unrelated ≤ 0.63.
const MIN_SCORE = 0.66;
/** Keep only passages close to the best match, so one strong hit is not padded with weak ones. */
const RELATIVE_WINDOW = 0.08;

function keywordScore(query: string, text: string): number {
  const terms = query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  if (terms.length === 0) return 0;
  const haystack = text.toLowerCase();
  const hits = terms.filter((term) => haystack.includes(term)).length;
  return hits / terms.length;
}

/**
 * Finds the passages most relevant to a question, within one organization
 * only. Searches uploaded documents and the built-in company policies.
 * Falls back to keyword matching when the embedding service is unavailable,
 * so search still works without an AI key.
 *
 * @param organizationId - From the verified token; never from the client body.
 * @param query - The user's question.
 * @param limit - Maximum passages to return.
 * @returns Passages, best first.
 * @example await searchKnowledge(orgId, 'How many sick days do I get?', 5)
 */
export async function searchKnowledge(organizationId: string, query: string, limit = 5): Promise<KnowledgePassage[]> {
  const [chunks, policies] = await Promise.all([
    KnowledgeChunk.find({ organizationId }).select('+embedding itemId text').sort({ createdAt: -1 }).limit(MAX_CANDIDATE_CHUNKS).lean(),
    CompanyPolicy.find({ organizationId }).select('policyType content').lean(),
  ]);

  const itemIds = [...new Set(chunks.map((chunk) => String(chunk.itemId)))];
  const items = await KnowledgeItem.find({ _id: { $in: itemIds }, organizationId }).select('name').lean();
  const nameById = new Map(items.map((item) => [String(item._id), item.name]));

  const policyPassages = policies.flatMap((policy) =>
    chunkText(policy.content).slice(0, 10).map((text) => ({
      sourceId: `policy:${policy.policyType}`,
      sourceName: POLICY_NAMES[policy.policyType] ?? 'Company Policy',
      text,
    }))
  );

  let scored: KnowledgePassage[];
  try {
    const runner = await getRunnerForOrganization(organizationId);
    const [[queryVector], policyVectors] = await Promise.all([
      embedTexts(runner, [query], 'RETRIEVAL_QUERY'),
      policyPassages.length > 0 ? embedTexts(runner, policyPassages.map((p) => p.text), 'RETRIEVAL_DOCUMENT') : Promise.resolve([]),
    ]);
    scored = [
      ...chunks.map((chunk) => ({
        sourceId: String(chunk.itemId),
        sourceName: nameById.get(String(chunk.itemId)) ?? 'Document',
        text: chunk.text,
        score: cosineSimilarity(queryVector, chunk.embedding),
      })),
      ...policyPassages.map((passage, index) => ({ ...passage, score: cosineSimilarity(queryVector, policyVectors[index]) })),
    ].filter((passage) => passage.score >= MIN_SCORE);
    const best = Math.max(0, ...scored.map((passage) => passage.score));
    scored = scored.filter((passage) => passage.score >= best - RELATIVE_WINDOW);
  } catch (error) {
    console.warn('[knowledge] embedding unavailable, using keyword search', {
      organizationId,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
    scored = [
      ...chunks.map((chunk) => ({
        sourceId: String(chunk.itemId),
        sourceName: nameById.get(String(chunk.itemId)) ?? 'Document',
        text: chunk.text,
        score: keywordScore(query, chunk.text),
      })),
      ...policyPassages.map((passage) => ({ ...passage, score: keywordScore(query, passage.text) })),
    ].filter((passage) => passage.score >= 0.5);
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
