'use server';
/**
 * @fileOverview An AI agent for generating job descriptions from prompts.
 *
 * - generateJobDescription - A function that handles the job description generation process.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { GenerateJobDescriptionInputSchemaDef as OriginalSchema, GenerateJobDescriptionOutputSchemaDef } from '@/ai/schemas/generate-job-description-definitions';

// Extend original schema to include optional apiKey
const GenerateJobDescriptionInputSchemaDef = OriginalSchema.extend({
  apiKey: z.string().optional().nullable(),
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
    const { apiKey, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    const promptText = `You are an expert HR assistant specializing in creating job descriptions.

    Based on the prompt provided, generate a detailed and professional job description.

    Prompt: ${promptData.prompt}`;

    const response = await runner.generate({
      model: 'gemini-2.0-flash',
      prompt: promptText,
      config: {
        output: {
          schema: GenerateJobDescriptionOutputSchemaDef,
        },
      },
    });

    const output = response.output;
    if (!output) {
      throw new Error("Failed to generate job description: No output from model.");
    }
    return output;
  }
);
