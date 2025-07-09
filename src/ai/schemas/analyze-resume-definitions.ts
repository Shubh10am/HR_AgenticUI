// This file is NOT 'use server'
import {z} from 'genkit';

export const AnalyzeResumeInputSchemaDef = z.object({
  resumeText: z.string().describe('The full text content of the candidate\'s resume.'),
  userId: z.string().optional().describe("The ID of the user making the request for logging."),
  organizationId: z.string().optional().describe("The ID of the organization for logging."),
});

export const AnalyzeResumeOutputSchemaDef = z.object({
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe('An estimated ATS compatibility score for the resume, from 0 to 100.'),
  overview: z
    .string()
    .describe('A concise summary of the candidate\'s profile based on the resume.'),
  keywords: z
    .array(z.string())
    .describe('Relevant keywords extracted from the resume that are important for ATS systems.'),
  strengths: z
    .array(z.string())
    .describe('Key strengths and qualifications highlighted in the resume.'),
  areasForImprovement: z
    .array(z.string())
    .describe('Actionable suggestions on how the resume could be improved for clarity, impact, or ATS optimization.'),
});
