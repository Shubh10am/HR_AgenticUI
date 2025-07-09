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
    const { apiKey, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    const promptText = `You are a helpful AI assistant called HR Streamline Copilot.
Respond to the user's message concisely and professionally. If you don't know the answer, say so.

User: ${promptData.userInput}
AI:`;

    const response = await runner.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: promptText,
      config: {
        output: {
          schema: CopilotChatOutputSchemaDef,
        },
      },
    });

    const output = response.output;
    if (!output) {
        throw new Error("Copilot chat failed: No output from model.");
    }
    return output;
  }
);
