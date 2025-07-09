'use server';

/**
 * @fileOverview Generates draft email responses (subject and body) for HR admins.
 *
 * - generateDraftEmailResponses - A function that generates draft email responses.
 * - GenerateDraftEmailResponsesInput - The input type for the generateDraftEmailResponses function.
 * - GenerateDraftEmailResponsesOutput - The return type for the generateDraftEmailResponses function.
 */

import {ai} from '@/ai/genkit';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { 
  GenerateDraftEmailResponsesInputSchemaDef as OriginalSchema, 
  GenerateDraftEmailResponsesOutputSchemaDef,
} from '@/ai/schemas/draft-email-response-definitions';
import { logTokenUsage } from '@/services/usageService';

// Extend original schema to include optional apiKey
const GenerateDraftEmailResponsesInputSchemaDef = OriginalSchema.extend({
  apiKey: z.string().optional().nullable(),
});

export type GenerateDraftEmailResponsesInput = z.infer<typeof GenerateDraftEmailResponsesInputSchemaDef>;
export type GenerateDraftEmailResponsesOutput = z.infer<typeof GenerateDraftEmailResponsesOutputSchemaDef>;

export async function generateDraftEmailResponses(input: GenerateDraftEmailResponsesInput): Promise<GenerateDraftEmailResponsesOutput> {
  return generateDraftEmailResponsesFlow(input);
}

const generateDraftEmailResponsesFlow = ai.defineFlow(
  {
    name: 'generateDraftEmailResponsesFlow',
    inputSchema: GenerateDraftEmailResponsesInputSchemaDef,
    outputSchema: GenerateDraftEmailResponsesOutputSchemaDef,
  },
  async (input) => {
    const { apiKey, userId, organizationId, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    const promptText = `You are an HR assistant tasked with drafting emails. Generate multiple distinct draft email options based on the following query/prompt. For each option, provide both a relevant subject line and the full email body.

Query/Prompt: ${promptData.query}

Format your response as a JSON object. The 'drafts' field in the JSON should contain an array of objects, where each object has a 'subject' (string) and a 'body' (string) field.
`;

    const response = await runner.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: promptText,
      output: {
        schema: GenerateDraftEmailResponsesOutputSchemaDef,
      },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({
        employeeId: userId,
        organizationId,
        feature: 'generateDraftEmailResponsesFlow',
        usage: response.usage,
      });
    }

    const output = response.output;
    if (!output) {
      throw new Error("Email draft generation failed: No output from model.");
    }
    return output;
  }
);
