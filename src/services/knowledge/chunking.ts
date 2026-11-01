/**
 * Splits document text into overlapping passages for embedding and retrieval.
 * Pure functions only — no I/O — so they are easy to reason about and test.
 */

export const CHUNK_TARGET_WORDS = 220;
export const CHUNK_OVERLAP_WORDS = 40;
export const MAX_CHUNKS_PER_DOCUMENT = 400;

/** Collapses runs of whitespace while keeping paragraph breaks. */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Splits text into passages of roughly `targetWords` words, breaking on
 * paragraph boundaries where possible and overlapping consecutive passages so
 * a sentence spanning a boundary is still found.
 *
 * @param text - The document's plain text.
 * @param targetWords - Approximate words per passage.
 * @param overlapWords - Words repeated from the end of the previous passage.
 * @returns Passages in document order, capped at {@link MAX_CHUNKS_PER_DOCUMENT}.
 * @example chunkText('Para one.\n\nPara two.') // ['Para one.\n\nPara two.']
 */
export function chunkText(text: string, targetWords = CHUNK_TARGET_WORDS, overlapWords = CHUNK_OVERLAP_WORDS): string[] {
  const paragraphs = normalizeText(text).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length === 0) return;
    chunks.push(current.join(' ').trim());
    current = current.slice(-overlapWords);
  };

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    if (current.length + words.length > targetWords && current.length > overlapWords) flush();
    for (const word of words) {
      current.push(word);
      if (current.length >= targetWords * 1.5) flush();
    }
    current.push('\n\n');
  }
  if (current.some((word) => word.trim() && word !== '\n\n')) flush();

  return chunks
    .map((chunk) => chunk.replace(/\s*\n\n\s*/g, '\n\n').trim())
    .filter((chunk, index, all) => chunk.length > 0 && chunk !== all[index - 1])
    .slice(0, MAX_CHUNKS_PER_DOCUMENT);
}

/** Cosine similarity of two equal-length vectors; 0 when either is empty. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
