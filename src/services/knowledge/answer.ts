import { z } from 'genkit';
import { logTokenUsage } from '@/services/usageService';
import { getRunnerForOrganization } from './embeddings';
import type { KnowledgePassage } from './search';
import { formatPassagesForPrompt } from './prompt';
import { CHAT_MODEL } from '@/ai/models';

const AnswerSchema = z.object({
  answer: z.string().describe('The answer, using only the provided passages.'),
  isAnswered: z.boolean().describe('False when the passages do not contain the answer.'),
});

export interface KnowledgeAnswer {
  answer: string;
  isAnswered: boolean;
}

/**
 * Answers a question strictly from the organization's knowledge passages.
 *
 * @param organizationId - From the verified token.
 * @param employeeId - Caller, for token-usage logging.
 * @param question - The user's question.
 * @param passages - Retrieved passages; may be empty.
 * @returns The answer and whether the passages actually covered it.
 * @throws When the model returns no output.
 */
export async function answerFromKnowledge(
  organizationId: string,
  employeeId: string,
  question: string,
  passages: KnowledgePassage[]
): Promise<KnowledgeAnswer> {
  if (passages.length === 0) {
    return { answer: "I couldn't find this in your knowledge base yet. Try rephrasing, or add a document that covers it.", isAnswered: false };
  }

  const runner = await getRunnerForOrganization(organizationId);
  const response = await runner.generate({
    model: CHAT_MODEL,
    prompt: `You are HR Streamline's knowledge assistant. Answer the question using ONLY the numbered passages below.
Cite the passages you used inline like [1] or [2]. If the passages do not contain the answer, set isAnswered to false and say so briefly — do not guess.
Keep the answer concise and practical.

Passages:
${formatPassagesForPrompt(passages)}

Question: ${question}`,
    output: { schema: AnswerSchema },
  });

  if (response.usage) {
    logTokenUsage({ employeeId, organizationId, feature: 'knowledgeAnswer', usage: response.usage });
  }
  if (!response.output) throw new Error('Knowledge answer failed: no output from model.');
  return response.output;
}
