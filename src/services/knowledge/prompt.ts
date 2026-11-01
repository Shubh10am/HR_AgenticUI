/** A knowledge passage as handed to a prompt: where it came from and its text. */
export interface PromptPassage {
  sourceName: string;
  text: string;
}

/**
 * Builds the reference block shared by every AI feature grounded in the
 * knowledge base. Passages are numbered so the model can cite them.
 *
 * @param passages - Passages from the knowledge search.
 * @returns A prompt fragment, or an empty string when there are none.
 * @example formatPassagesForPrompt([{ sourceName: 'Leave Policy', text: '20 days…' }])
 */
export function formatPassagesForPrompt(passages: PromptPassage[]): string {
  if (passages.length === 0) return '';
  return passages.map((passage, index) => `[${index + 1}] From "${passage.sourceName}":\n${passage.text}`).join('\n\n');
}
