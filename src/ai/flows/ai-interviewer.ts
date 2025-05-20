// This is an AI-powered interviewer flow that conducts initial screening interviews.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiInterviewerInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the position being interviewed for.'),
  candidateResume: z
    .string()
    .describe('The candidate\'s resume text.'),
  candidateName: z.string().describe('The name of the candidate.'),
  interviewRounds: z
    .number()
    .describe(
      'The number of interview rounds to conduct. Each round consists of one question.'
    )
    .default(3),
});

export type AiInterviewerInput = z.infer<typeof AiInterviewerInputSchema>;

const AiInterviewerOutputSchema = z.object({
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

export type AiInterviewerOutput = z.infer<typeof AiInterviewerOutputSchema>;

export async function aiInterviewer(input: AiInterviewerInput): Promise<AiInterviewerOutput> {
  return aiInterviewerFlow(input);
}

const aiInterviewerPrompt = ai.definePrompt({
  name: 'aiInterviewerPrompt',
  input: {schema: AiInterviewerInputSchema},
  output: {schema: AiInterviewerOutputSchema},
  prompt: `You are an AI interviewer conducting an initial screening interview.
Your goal is to assess the candidate's qualifications, experience, and fit for the role based on their resume and your questions.

Here is the job description:
{{{jobDescription}}}

Here is the candidate's resume:
{{{candidateResume}}}

Candidate Name: {{{candidateName}}}

You will conduct {{{interviewRounds}}} rounds of questions. After each round, you MUST provide feedback and a score out of 100.
At the end, you will provide an overall feedback, the interview transcript, and a candidate fit score.

Output must follow the AiInterviewerOutputSchema format.

Begin Interview:
`, // TODO Add ability to customize safety settings.
})

const aiInterviewerFlow = ai.defineFlow(
  {
    name: 'aiInterviewerFlow',
    inputSchema: AiInterviewerInputSchema,
    outputSchema: AiInterviewerOutputSchema,
  },
  async input => {
    const {output} = await aiInterviewerPrompt(input);
    return output!;
  }
);
