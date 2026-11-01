'use server';
/**
 * @fileOverview Summarizes recent GitHub activity for a specific employee or team.
 *
 * - summarizeGithubActivity - A function that summarizes GitHub activity.
 * - SummarizeGithubActivityInput - The input type for the summarizeGithubActivity function.
 * - SummarizeGithubActivityOutput - The return type for the summarizeGithubActivity function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'genkit';
import { SummarizeGithubActivityInputSchemaDef as OriginalSchema, SummarizeGithubActivityOutputSchemaDef } from '@/ai/schemas/summarize-github-activity-definitions';
import { logTokenUsage } from '@/services/usageService';
import { resolveAiContext } from '@/ai/runtime';

// Extend original schema with the caller's sign-in token
const SummarizeGithubActivityInputSchemaDef = OriginalSchema.extend({
  authToken: z.string().optional().nullable().describe('The caller\'s sign-in token. The organization, user and AI key are derived from it on the server.'),
});


export type SummarizeGithubActivityInput = z.infer<typeof SummarizeGithubActivityInputSchemaDef>;
export type SummarizeGithubActivityOutput = z.infer<typeof SummarizeGithubActivityOutputSchemaDef>;

export async function summarizeGithubActivity(input: SummarizeGithubActivityInput): Promise<SummarizeGithubActivityOutput> {
  return summarizeGithubActivityFlow(input);
}

const summarizeGithubActivityFlow = ai.defineFlow(
  {
    name: 'summarizeGithubActivityFlow',
    inputSchema: SummarizeGithubActivityInputSchemaDef,
    outputSchema: SummarizeGithubActivityOutputSchemaDef,
  },
  async (input) => {
    const { authToken, userId: _untrustedUserId, organizationId: _untrustedOrganizationId, ...promptData } = input;
    
    // Identity and key come from the verified token, not from the client-supplied ids.
    
    const { runner, model, userId, organizationId } = await resolveAiContext(authToken);

    const promptText = `You are an HR assistant tasked with providing summaries of employee github activity.

    Summarize the recent GitHub activity for ${promptData.githubUsername} for the past ${promptData.timePeriod}.
    Include key contributions, merged pull requests, and any other relevant information.
    `;

    const response = await runner.generate({
      model,
      prompt: promptText,
      output: {
        schema: SummarizeGithubActivityOutputSchemaDef,
      },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({
        employeeId: userId,
        organizationId,
        feature: 'summarizeGithubActivityFlow',
        usage: response.usage,
      });
    }
    
    const output = response.output;
    if (!output) {
        throw new Error("GitHub activity summary failed: No output from model.");
    }
    return output;
  }
);
