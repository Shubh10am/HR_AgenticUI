// This is an AI-powered interviewer flow that conducts initial screening interviews.
'use server';

import {ai} from '@/ai/genkit';
import {genkit, z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { AiInterviewerInputSchemaDef as OriginalSchema, AiInterviewerOutputSchemaDef } from '@/ai/schemas/ai-interviewer-definitions';

// Extend original schema to include optional apiKey
const AiInterviewerInputSchemaDef = OriginalSchema.extend({
  apiKey: z.string().optional().nullable(),
});

export type AiInterviewerInput = z.infer<typeof AiInterviewerInputSchemaDef>;
export type AiInterviewerOutput = z.infer<typeof AiInterviewerOutputSchemaDef>;

export async function aiInterviewer(input: AiInterviewerInput): Promise<AiInterviewerOutput> {
  return aiInterviewerFlow(input);
}

const aiInterviewerFlow = ai.defineFlow(
  {
    name: 'aiInterviewerFlow',
    inputSchema: AiInterviewerInputSchemaDef,
    outputSchema: AiInterviewerOutputSchemaDef,
  },
  async (input) => {
    const { apiKey, ...promptData } = input;
    
    const runner = apiKey ? genkit({plugins: [googleAI({apiKey})]}) : ai;

    const promptText = `You are an AI interviewer conducting an initial screening interview.
Your goal is to assess the candidate's qualifications, experience, and fit for the role based on their resume and your questions.

Here is the job description:
${promptData.jobDescription}

Here is the candidate's resume:
${promptData.candidateResume}

Candidate Name: ${promptData.candidateName}

You will conduct ${promptData.interviewRounds} rounds of questions. After each round, you MUST provide feedback and a score out of 100.
At the end, you will provide an overall feedback, the interview transcript, and a candidate fit score.

Output must follow the AiInterviewerOutputSchema format.

Begin Interview:
`;

    const response = await runner.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: promptText,
      output: {
        schema: AiInterviewerOutputSchemaDef,
      },
    });

    const output = response.output;
    if (!output) {
      throw new Error("AI Interviewer failed: No output from model.");
    }
    return output;
  }
);
