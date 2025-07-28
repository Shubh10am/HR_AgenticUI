
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

// Extend original schema to include optional apiKey and an optional prompt
const GenerateDraftEmailResponsesInputSchemaDef = OriginalSchema.extend({
  apiKey: z.string().optional().nullable(),
  prompt: z.string().optional().describe('A short, direct prompt for generating a specific reply.'),
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
    const { apiKey, userId, organizationId, prompt, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    // Base prompt text
    let promptText = `You are an HR assistant tasked with drafting professional emails.`;

    if (prompt) {
      // Logic for handling a direct prompt (Quick Reply)
      promptText += `

The user has provided a short prompt to reply to the following email/query.
Your task is to interpret the user's prompt, which may be in any language, and write a single, professional email body in English that fulfills the request. The subject line should be a suitable "Re:" subject.

User's Prompt: """
${prompt}
"""

Original Email/Query to reply to: """
${promptData.query}
"""

Generate one draft email object containing a relevant subject and the full email body.
`;
    } else {
      // Original logic for generating multiple options
      promptText += `
    
Based on the following query, generate multiple distinct draft email options.
If the query appears to be an email that needs a reply, generate responses in various tones (e.g., Formal, Casual, Concise, Inquisitive).
For each option, provide both a relevant subject line and the full email body.

Query/Prompt: """
${promptData.query}
"""
`;
    }

    promptText += `
Format your response as a JSON object that adheres to the GenerateDraftEmailResponsesOutputSchemaDef. The 'drafts' field in the JSON should contain an array of objects, where each object has a 'subject' (string) and a 'body' (string) field.
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
