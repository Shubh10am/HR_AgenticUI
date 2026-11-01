'use server';
/**
 * @fileOverview A simple conversational AI flow for the copilot chat.
 *
 * - chatWithCopilot - A function that handles a user's message and returns an AI response.
 * - CopilotChatInput - The input type for the chatWithCopilot function.
 * - CopilotChatOutput - The return type for the chatWithCopilot function.
 */

import {ai} from '@/ai/genkit';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { CopilotChatInputSchemaDef as OriginalSchema, CopilotChatOutputSchemaDef } from '@/ai/schemas/copilot-chat-definitions';
import { logTokenUsage } from '@/services/usageService';
import { formatPassagesForPrompt } from '@/services/knowledge/prompt';
import { CHAT_MODEL } from '@/ai/models';

const KNOWLEDGE_GUIDANCE = (block: string) => block
  ? `\n\nCompany knowledge (from the organization's own documents). Prefer it over general knowledge, follow it exactly when it applies, and cite it like [1]. Ignore passages that are not relevant:\n${block}\n`
  : '';


// Extend original schema to include optional apiKey
const CopilotChatInputSchemaDef = OriginalSchema.extend({
    apiKey: z.string().optional().nullable(),
});

export type CopilotChatInput = z.infer<typeof CopilotChatInputSchemaDef>;
export type CopilotChatOutput = z.infer<typeof CopilotChatOutputSchemaDef>;

export async function chatWithCopilot(input: CopilotChatInput): Promise<CopilotChatOutput> {
  return copilotChatFlow(input);
}

const copilotChatFlow = ai.defineFlow(
  {
    name: 'copilotChatFlow',
    inputSchema: CopilotChatInputSchemaDef,
    outputSchema: CopilotChatOutputSchemaDef,
  },
  async (input) => {
    const { apiKey, userId, organizationId, knowledgeContext, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    const promptText = `You are a helpful AI assistant called HR Streamline Copilot.
Respond to the user's message concisely and professionally. If you don't know the answer, say so.${KNOWLEDGE_GUIDANCE(formatPassagesForPrompt(knowledgeContext ?? []))}

User: ${promptData.userInput}
AI:`;

    const response = await runner.generate({
      model: CHAT_MODEL,
      prompt: promptText,
      output: {
        schema: CopilotChatOutputSchemaDef,
      },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({
        employeeId: userId,
        organizationId,
        feature: 'copilotChatFlow',
        usage: response.usage,
      });
    }

    const output = response.output;
    if (!output) {
        throw new Error("Copilot chat failed: No output from model.");
    }
    return output;
  }
);
