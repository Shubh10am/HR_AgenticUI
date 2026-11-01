// This is an AI-powered interviewer flow that conducts initial screening interviews.
'use server';

import {ai} from '@/ai/genkit';
import { z } from 'genkit';
import { AiInterviewerInputSchemaDef as OriginalSchema, AiInterviewerOutputSchemaDef } from '@/ai/schemas/ai-interviewer-definitions';
import { logTokenUsage } from '@/services/usageService';
import { resolveAiContext } from '@/ai/runtime';

// Extend original schema with the caller's sign-in token
const AiInterviewerInputSchemaDef = OriginalSchema.extend({
  authToken: z.string().optional().nullable().describe('The caller\'s sign-in token. The organization, user and AI key are derived from it on the server.'),
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
    const { authToken, userId: _untrustedUserId, organizationId: _untrustedOrganizationId, ...promptData } = input;
    
    // Identity and key come from the verified token, not from the client-supplied ids.
    
    const { runner, model, userId, organizationId } = await resolveAiContext(authToken);

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
      model,
      prompt: promptText,
      output: {
        schema: AiInterviewerOutputSchemaDef,
      },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({
        employeeId: userId,
        organizationId,
        feature: 'aiInterviewerFlow',
        usage: response.usage,
      });
    }

    const output = response.output;
    if (!output) {
      throw new Error("AI Interviewer failed: No output from model.");
    }
    return output;
  }
);
