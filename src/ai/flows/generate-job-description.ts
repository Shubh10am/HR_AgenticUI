
// src/ai/flows/generate-job-description.ts
'use server';
/**
 * @fileOverview An AI agent for generating job descriptions from prompts.
 *
 * - generateJobDescription - A function that handles the job description generation process.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateJobDescriptionInputSchemaDef, GenerateJobDescriptionOutputSchemaDef } from '@/ai/schemas/generate-job-description-definitions';

export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchemaDef>;
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchemaDef>;

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchemaDef},
  output: {schema: GenerateJobDescriptionOutputSchemaDef},
  prompt: `You are an expert HR assistant specializing in creating job descriptions.

  Based on the prompt provided, generate a detailed and professional job description.

  Prompt: {{{prompt}}}`,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchemaDef,
    outputSchema: GenerateJobDescriptionOutputSchemaDef,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
