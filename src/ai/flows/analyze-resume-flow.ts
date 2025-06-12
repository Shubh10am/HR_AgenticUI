
'use server';
/**
 * @fileOverview An AI agent for analyzing resumes, providing an ATS-like score, overview, keywords, strengths, and areas for improvement.
 *
 * - analyzeResume - A function that handles the resume analysis process.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { AnalyzeResumeInputSchemaDef, AnalyzeResumeOutputSchemaDef } from '@/ai/schemas/analyze-resume-definitions';

export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchemaDef>;
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchemaDef>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchemaDef},
  output: {schema: AnalyzeResumeOutputSchemaDef},
  prompt: `You are an expert HR professional and resume analyst with deep knowledge of Applicant Tracking Systems (ATS).
Analyze the provided resume text thoroughly.

Resume Text:
{{{resumeText}}}

Based on the resume, provide the following:
1.  **ATS Score (0-100):** Estimate an ATS compatibility score. Consider factors like keyword relevance (common skills, job titles), formatting (though you only see text), clarity, and completeness.
2.  **Overview:** A brief summary of the candidate's professional profile, experience level, and key skills.
3.  **Keywords:** Extract a list of 5-10 most important keywords and phrases from the resume that an ATS would likely pick up (e.g., specific technologies, skills, certifications, job titles).
4.  **Strengths:** Identify and list 3-5 key strengths or compelling qualifications evident from the resume.
5.  **Areas for Improvement:** Provide 3-5 actionable suggestions on how this resume could be improved. Focus on aspects like quantifying achievements, using stronger action verbs, tailoring for specific roles (general advice), clarity, or addressing potential ATS parsing issues if evident from the text structure (e.g., overuse of complex tables if implied by text flow).

Ensure your output strictly adheres to the AnalyzeResumeOutputSchemaDef format.
`,
});

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchemaDef,
    outputSchema: AnalyzeResumeOutputSchemaDef,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
