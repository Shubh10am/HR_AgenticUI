
// This file is NOT 'use server'
import {z} from 'genkit';

export const SummarizeGithubActivityInputSchemaDef = z.object({
  githubUsername: z.string().describe('The GitHub username of the employee or team.'),
  timePeriod: z.string().describe('The time period to summarize (e.g., last week, last month).'),
  userId: z.string().optional().describe("The ID of the user making the request for logging."),
  organizationId: z.string().optional().describe("The ID of the organization for logging."),
});

export const SummarizeGithubActivityOutputSchemaDef = z.object({
  summary: z.string().describe('A summary of the recent GitHub activity.'),
});
