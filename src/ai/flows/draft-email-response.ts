
'use server';

/**
 * @fileOverview Generates draft email responses (subject and body) for HR admins.
 *
 * - generateDraftEmailResponses - A function that generates draft email responses.
 * - GenerateDraftEmailResponsesInput - The input type for the generateDraftEmailResponses function.
 * - GenerateDraftEmailResponsesOutput - The return type for the generateDraftEmailResponses function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'genkit';
import { 
  GenerateDraftEmailResponsesInputSchemaDef as OriginalSchema, 
  GenerateDraftEmailResponsesOutputSchemaDef,
} from '@/ai/schemas/draft-email-response-definitions';
import { logTokenUsage } from '@/services/usageService';
import { formatPassagesForPrompt } from '@/services/knowledge/prompt';
import { resolveAiContext } from '@/ai/runtime';

const KNOWLEDGE_GUIDANCE = (block: string) => block
  ? `\n\nCompany knowledge (from the organization's own documents). Prefer it over general knowledge, follow it exactly when it applies, and cite it like [1]. Ignore passages that are not relevant:\n${block}\n`
  : '';


// Extend original schema with the caller's sign-in token. The prompt field is now in the base schema.
const GenerateDraftEmailResponsesInputSchemaDef = OriginalSchema.extend({
  authToken: z.string().optional().nullable().describe('The caller\'s sign-in token. The organization, user and AI key are derived from it on the server.'),
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
    // Correctly destructure all properties, including the optional prompt
    const { authToken, userId: _untrustedUserId, organizationId: _untrustedOrganizationId, prompt, query, knowledgeContext } = input;
    
    // Identity and key come from the verified token, not from the client-supplied ids.
    
    const { runner, model, userId, organizationId } = await resolveAiContext(authToken);

    // Base prompt text
    let promptText = `You are an HR assistant tasked with drafting professional emails.`;
    promptText += KNOWLEDGE_GUIDANCE(formatPassagesForPrompt(knowledgeContext ?? []));
    if (knowledgeContext?.length) {
      promptText += `When a draft relies on company knowledge, state the facts plainly in the email. Do not include the [n] citation markers in the email itself.\n`;
    }

    if (prompt) {
      // Logic for handling a direct prompt (Quick Reply)
      promptText += `

The user has provided a short prompt to reply to the following email/query.
Your task is to interpret the user's prompt, which may be in any language, and write a single, professional email body in English that fulfills the request. The subject line should be a suitable "Re:" subject.

User's Prompt: """
${prompt}
"""

Original Email/Query to reply to: """
${query}
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
${query}
"""
`;
    }

    promptText += `
Format your response as a JSON object that adheres to the GenerateDraftEmailResponsesOutputSchemaDef. The 'drafts' field in the JSON should contain an array of objects, where each object has a 'subject' (string) and a 'body' (string) field.
`;

    const response = await runner.generate({
      model,
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
