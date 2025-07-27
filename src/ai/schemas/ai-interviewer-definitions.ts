
// This file is NOT 'use server'
import {z} from 'genkit';

export const AiInterviewerInputSchemaDef = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the position being interviewed for.'),
  candidateResume: z
    .string()
    .describe("The candidate's resume text."),
  candidateName: z.string().describe('The name of the candidate.'),
  interviewRounds: z
    .number()
    .describe(
      'The number of interview rounds to conduct. Each round consists of one question.'
    )
    .default(3),
  userId: z.string().optional().describe("The ID of the user making the request for logging."),
  organizationId: z.string().optional().nullable().describe("The ID of the organization for logging."),
});

export const AiInterviewerOutputSchemaDef = z.object({
  overallFeedback: z
    .string()
    .describe(
      'Overall feedback and assessment of the candidate, including strengths and weaknesses, and a recommendation on whether to proceed to the next round.'
    ),
  interviewTranscript: z
    .string()
    .describe('A transcript of the interview, including questions and answers.'),
  candidateFitScore: z
    .number()
    .describe(
      'A numerical score (0-100) representing the candidate\'s overall fit for the role, based on the interview and resume.'
    ),
});
