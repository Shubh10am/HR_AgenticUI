
'use server';
/**
 * @fileOverview A simple conversational AI flow for the copilot chat.
 *
 * - chatWithCopilot - A function that handles a user's message and returns an AI response.
 * - CopilotChatInput - The input type for the chatWithCopilot function.
 * - CopilotChatOutput - The return type for the chatWithCopilot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CopilotChatInputSchemaDef, CopilotChatOutputSchemaDef } from '@/ai/schemas/copilot-chat-definitions';

export type CopilotChatInput = z.infer<typeof CopilotChatInputSchemaDef>;
export type CopilotChatOutput = z.infer<typeof CopilotChatOutputSchemaDef>;

export async function chatWithCopilot(input: CopilotChatInput): Promise<CopilotChatOutput> {
  return copilotChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'copilotChatPrompt',
  input: {schema: CopilotChatInputSchemaDef},
  output: {schema: CopilotChatOutputSchemaDef},
  prompt: `You are a helpful AI assistant called HR Streamline Copilot.
Respond to the user's message concisely and professionally. If you don't know the answer, say so.

User: {{{userInput}}}
AI:`,
});

const copilotChatFlow = ai.defineFlow(
  {
    name: 'copilotChatFlow',
    inputSchema: CopilotChatInputSchemaDef,
    outputSchema: CopilotChatOutputSchemaDef,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
