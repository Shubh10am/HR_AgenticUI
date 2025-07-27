
// This file is NOT 'use server'
import {z} from 'genkit';

export const GenerateJobDescriptionInputSchemaDef = z.object({
  prompt: z.string().describe('A prompt describing the job requirements.'),
  userId: z.string().optional().describe("The ID of the user making the request for logging."),
  organizationId: z.string().optional().nullable().describe("The ID of the organization for logging."),
});

export const GenerateJobDescriptionOutputSchemaDef = z.object({
  jobDescription: z.string().describe('The generated job description.'),
});
