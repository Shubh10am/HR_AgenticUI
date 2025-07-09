'use server';
/**
 * @fileOverview An AI agent for analyzing resumes, providing an ATS-like score, overview, keywords, strengths, and areas for improvement.
 *
 * - analyzeResume - A function that handles the resume analysis process.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

import {ai} from '@/ai/genkit';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { AnalyzeResumeInputSchemaDef as OriginalSchema, AnalyzeResumeOutputSchemaDef } from '@/ai/schemas/analyze-resume-definitions';

// Extend original schema to include optional apiKey
const AnalyzeResumeInputSchemaDef = OriginalSchema.extend({
  apiKey: z.string().optional().nullable(),
});


export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchemaDef>;
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchemaDef>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchemaDef,
    outputSchema: AnalyzeResumeOutputSchemaDef,
  },
  async (input) => {
    const { apiKey, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    const promptText = `You are an expert HR professional and resume analyst with deep knowledge of Applicant Tracking Systems (ATS).
Analyze the provided resume text thoroughly.

Resume Text:
${promptData.resumeText}

Based on the resume, provide the following:
1.  **ATS Score (0-100):** Estimate an ATS compatibility score. Consider factors like keyword relevance (common skills, job titles), formatting (though you only see text), clarity, and completeness.
2.  **Overview:** A brief summary of the candidate's professional profile, experience level, and key skills.
3.  **Keywords:** Extract a list of 5-10 most important keywords and phrases from the resume that an ATS would likely pick up (e.g., specific technologies, skills, certifications, job titles).
4.  **Strengths:** Identify and list 3-5 key strengths or compelling qualifications evident from the resume.
5.  **Areas for Improvement:** Provide 3-5 actionable suggestions on how this resume could be improved. Focus on aspects like quantifying achievements, using stronger action verbs, tailoring for specific roles (general advice), clarity, or addressing potential ATS parsing issues if evident from the text flow (e.g., overuse of complex tables if implied by text flow).

Ensure your output strictly adheres to the AnalyzeResumeOutputSchemaDef format.
`;

    const response = await runner.generate({
      model: 'gemini-2.0-flash',
      prompt: promptText,
      config: {
        output: {
          schema: AnalyzeResumeOutputSchemaDef,
        },
      },
    });

    const output = response.output;
    if (!output) {
      throw new Error("Resume analysis failed: No output from model.");
    }
    return output;
  }
);
