
// This is an AI-powered interviewer flow that conducts initial screening interviews.
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { AiInterviewerInputSchemaDef, AiInterviewerOutputSchemaDef } from '@/ai/schemas/ai-interviewer-definitions';

export type AiInterviewerInput = z.infer<typeof AiInterviewerInputSchemaDef>;
export type AiInterviewerOutput = z.infer<typeof AiInterviewerOutputSchemaDef>;

export async function aiInterviewer(input: AiInterviewerInput): Promise<AiInterviewerOutput> {
  return aiInterviewerFlow(input);
}

const aiInterviewerPrompt = ai.definePrompt({
  name: 'aiInterviewerPrompt',
  input: {schema: AiInterviewerInputSchemaDef},
  output: {schema: AiInterviewerOutputSchemaDef},
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
`, 
})

const aiInterviewerFlow = ai.defineFlow(
  {
    name: 'aiInterviewerFlow',
    inputSchema: AiInterviewerInputSchemaDef,
    outputSchema: AiInterviewerOutputSchemaDef,
  },
  async input => {
    const {output} = await aiInterviewerPrompt(input);
    return output!;
  }
);
