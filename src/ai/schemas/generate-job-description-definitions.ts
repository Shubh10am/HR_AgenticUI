
// This file is NOT 'use server'
import {z} from 'genkit';

export const GenerateJobDescriptionInputSchemaDef = z.object({
  prompt: z.string().describe('A prompt describing the job requirements.'),
});

export const GenerateJobDescriptionOutputSchemaDef = z.object({
  jobDescription: z.string().describe('The generated job description.'),
});
