
'use server';
/**
 * @fileOverview Summarizes recent GitHub activity for a specific employee or team.
 *
 * - summarizeGithubActivity - A function that summarizes GitHub activity.
 * - SummarizeGithubActivityInput - The input type for the summarizeGithubActivity function.
 * - SummarizeGithubActivityOutput - The return type for the summarizeGithubActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SummarizeGithubActivityInputSchemaDef, SummarizeGithubActivityOutputSchemaDef } from '@/ai/schemas/summarize-github-activity-definitions';

export type SummarizeGithubActivityInput = z.infer<typeof SummarizeGithubActivityInputSchemaDef>;
export type SummarizeGithubActivityOutput = z.infer<typeof SummarizeGithubActivityOutputSchemaDef>;

export async function summarizeGithubActivity(input: SummarizeGithubActivityInput): Promise<SummarizeGithubActivityOutput> {
  return summarizeGithubActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeGithubActivityPrompt',
  input: {schema: SummarizeGithubActivityInputSchemaDef},
  output: {schema: SummarizeGithubActivityOutputSchemaDef},
  prompt: `You are an HR assistant tasked with providing summaries of employee github activity.

  Summarize the recent GitHub activity for {{githubUsername}} for the past {{timePeriod}}.
  Include key contributions, merged pull requests, and any other relevant information.
  `,
});

const summarizeGithubActivityFlow = ai.defineFlow(
  {
    name: 'summarizeGithubActivityFlow',
    inputSchema: SummarizeGithubActivityInputSchemaDef,
    outputSchema: SummarizeGithubActivityOutputSchemaDef,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
