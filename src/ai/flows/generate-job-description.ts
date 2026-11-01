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

    const promptText = `You are an expert HR assistant specializing in creating job descriptions.

    Based on the prompt provided, generate a detailed and professional job description.

    Prompt: ${promptData.prompt}`;

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
