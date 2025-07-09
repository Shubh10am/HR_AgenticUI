'use server';
/**
 * @fileOverview Summarizes recent GitHub activity for a specific employee or team.
 *
 * - summarizeGithubActivity - A function that summarizes GitHub activity.
 * - SummarizeGithubActivityInput - The input type for the summarizeGithubActivity function.
 * - SummarizeGithubActivityOutput - The return type for the summarizeGithubActivity function.
 */

import {ai} from '@/ai/genkit';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { SummarizeGithubActivityInputSchemaDef as OriginalSchema, SummarizeGithubActivityOutputSchemaDef } from '@/ai/schemas/summarize-github-activity-definitions';

// Extend original schema to include optional apiKey
const SummarizeGithubActivityInputSchemaDef = OriginalSchema.extend({
  apiKey: z.string().optional().nullable(),
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
    const { apiKey, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    const promptText = `You are an HR assistant tasked with providing summaries of employee github activity.

    Summarize the recent GitHub activity for ${promptData.githubUsername} for the past ${promptData.timePeriod}.
    Include key contributions, merged pull requests, and any other relevant information.
    `;

    const response = await runner.generate({
      model: 'gemini-2.0-flash',
      prompt: promptText,
      config: {
        output: {
          schema: SummarizeGithubActivityOutputSchemaDef,
        },
      },
    });
    
    const output = response.output;
    if (!output) {
        throw new Error("GitHub activity summary failed: No output from model.");
    }
    return output;
  }
);
