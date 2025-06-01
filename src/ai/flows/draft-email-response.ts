
'use server';

/**
 * @fileOverview Generates draft email responses (subject and body) for HR admins.
 *
 * - generateDraftEmailResponses - A function that generates draft email responses.
 * - GenerateDraftEmailResponsesInput - The input type for the generateDraftEmailResponses function.
 * - GenerateDraftEmailResponsesOutput - The return type for the generateDraftEmailResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  GenerateDraftEmailResponsesInputSchemaDef, 
  GenerateDraftEmailResponsesOutputSchemaDef,
  DraftEmailSchemaDef // Though DraftEmailSchemaDef is used within OutputSchemaDef, importing explicitly is fine.
} from '@/ai/schemas/draft-email-response-definitions';

export type GenerateDraftEmailResponsesInput = z.infer<typeof GenerateDraftEmailResponsesInputSchemaDef>;
export type GenerateDraftEmailResponsesOutput = z.infer<typeof GenerateDraftEmailResponsesOutputSchemaDef>;
// If DraftEmail type is needed by client, export it here as well:
// export type DraftEmail = z.infer<typeof DraftEmailSchemaDef>;


export async function generateDraftEmailResponses(input: GenerateDraftEmailResponsesInput): Promise<GenerateDraftEmailResponsesOutput> {
  return generateDraftEmailResponsesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDraftEmailResponsesPrompt',
  input: {schema: GenerateDraftEmailResponsesInputSchemaDef},
  output: {schema: GenerateDraftEmailResponsesOutputSchemaDef},
  prompt: `You are an HR assistant tasked with drafting emails. Generate multiple distinct draft email options based on the following query/prompt. For each option, provide both a relevant subject line and the full email body.

Query/Prompt: {{{query}}}

Format your response as a JSON object. The 'drafts' field in the JSON should contain an array of objects, where each object has a 'subject' (string) and a 'body' (string) field.
`,
});

const generateDraftEmailResponsesFlow = ai.defineFlow(
  {
    name: 'generateDraftEmailResponsesFlow',
    inputSchema: GenerateDraftEmailResponsesInputSchemaDef,
    outputSchema: GenerateDraftEmailResponsesOutputSchemaDef,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
