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

const SummarizeGithubActivityInputSchema = z.object({
  githubUsername: z.string().describe('The GitHub username of the employee or team.'),
  timePeriod: z.string().describe('The time period to summarize (e.g., last week, last month).'),
});
export type SummarizeGithubActivityInput = z.infer<typeof SummarizeGithubActivityInputSchema>;

const SummarizeGithubActivityOutputSchema = z.object({
  summary: z.string().describe('A summary of the recent GitHub activity.'),
});
export type SummarizeGithubActivityOutput = z.infer<typeof SummarizeGithubActivityOutputSchema>;

export async function summarizeGithubActivity(input: SummarizeGithubActivityInput): Promise<SummarizeGithubActivityOutput> {
  return summarizeGithubActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeGithubActivityPrompt',
  input: {schema: SummarizeGithubActivityInputSchema},
  output: {schema: SummarizeGithubActivityOutputSchema},
  prompt: `You are an HR assistant tasked with providing summaries of employee github activity.

  Summarize the recent GitHub activity for {{githubUsername}} for the past {{timePeriod}}.
  Include key contributions, merged pull requests, and any other relevant information.
  `,
});

const summarizeGithubActivityFlow = ai.defineFlow(
  {
    name: 'summarizeGithubActivityFlow',
    inputSchema: SummarizeGithubActivityInputSchema,
    outputSchema: SummarizeGithubActivityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
