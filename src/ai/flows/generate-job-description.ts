'use server';
/**
 * @fileOverview An AI agent for generating job descriptions from prompts.
 *
 * - generateJobDescription - A function that handles the job description generation process.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateJobDescriptionInputSchemaDef as OriginalSchema, GenerateJobDescriptionOutputSchemaDef } from '@/ai/schemas/generate-job-description-definitions';
import { logTokenUsage } from '@/services/usageService';
import { resolveAiContext } from '@/ai/runtime';

// Extend original schema with the caller's sign-in token
const GenerateJobDescriptionInputSchemaDef = OriginalSchema.extend({
  authToken: z.string().optional().nullable().describe('The caller\'s sign-in token. The organization, user and AI key are derived from it on the server.'),
});

export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchemaDef>;
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchemaDef>;

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchemaDef,
    outputSchema: GenerateJobDescriptionOutputSchemaDef,
  },
  async (input) => {
    const { authToken, userId: _untrustedUserId, organizationId: _untrustedOrganizationId, ...promptData } = input;
    
    // Identity and key come from the verified token, not from the client-supplied ids.
    
    const { runner, model, userId, organizationId } = await resolveAiContext(authToken);

    const promptText = `You are an expert HR partner writing a job description that attracts strong, diverse applicants.

Write it in Markdown with these sections, in order: a one-line hook, "About the role", "What you'll do" (5-7 bullets),
"What you'll bring" (must-haves only, 4-6 bullets), "Nice to have" (2-4 bullets), "What we offer" (only what the brief
states; otherwise a short generic line), and "How to apply".

Use inclusive, plain language: no gendered words, no age or "digital native" phrasing, no unnecessary degree or
years-of-experience requirements beyond what the brief asks, and say that reasonable adjustments are available.
Do not invent salary, benefits or company facts that are not in the brief.

Brief:
${promptData.prompt}`;

    const response = await runner.generate({
      model,
      prompt: promptText,
      output: {
        schema: GenerateJobDescriptionOutputSchemaDef,
      },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({
        employeeId: userId,
        organizationId,
        feature: 'generateJobDescriptionFlow',
        usage: response.usage,
      });
    }

    const output = response.output;
    if (!output) {
      throw new Error("Failed to generate job description: No output from model.");
    }
    return output;
  }
);
