'use server';
/**
 * @fileOverview Builds an interview kit (questions, what to look for, scorecard) for a human interviewer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FAIR_HIRING_RULES, InterviewKitInputSchema, InterviewKitOutputSchema } from '@/ai/schemas/recruitment-definitions';
import { logTokenUsage } from '@/services/usageService';
import { resolveAiContext } from '@/ai/runtime';

const InputSchema = InterviewKitInputSchema.extend({
  authToken: z.string().optional().nullable().describe('The caller\'s sign-in token. The organization, user and AI key are derived from it on the server.'),
});

export type InterviewKitInput = z.infer<typeof InputSchema>;
export type InterviewKitOutput = z.infer<typeof InterviewKitOutputSchema>;

export async function generateInterviewKit(input: InterviewKitInput): Promise<InterviewKitOutput> {
  return interviewKitFlow(input);
}

const interviewKitFlow = ai.defineFlow(
  { name: 'interviewKitFlow', inputSchema: InputSchema, outputSchema: InterviewKitOutputSchema },
  async (input) => {
    const { authToken, jobDescription, candidateSummary, rounds, questionsPerRound } = input;
    const { runner, model, userId, organizationId } = await resolveAiContext(authToken);

    const response = await runner.generate({
      model,
      prompt: `You are a hiring-process expert writing a structured interview kit for human interviewers.

${FAIR_HIRING_RULES}
- Ask the same core questions of every candidate for a round so they are compared fairly; candidate-specific probes go last.
- Never ask about protected characteristics, family plans, health, or immigration beyond legal right to work.

Create these rounds, in order: ${rounds.join(', ')}. Give ${questionsPerRound} questions per round.
For each question say what a strong answer includes and what would be a red flag.
Then give a 4-6 item scorecard of job-relevant competencies rated 1-5.

JOB DESCRIPTION:
"""${jobDescription}"""
${candidateSummary ? `\nSCREENING NOTES FOR THIS CANDIDATE (use for the final 1-2 probing questions only):\n"""${candidateSummary}"""` : ''}`,
      output: { schema: InterviewKitOutputSchema },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({ employeeId: userId, organizationId, feature: 'interviewKitFlow', usage: response.usage });
    }
    if (!response.output) throw new Error('Could not build the interview kit: no output from the model.');
    return response.output;
  }
);
