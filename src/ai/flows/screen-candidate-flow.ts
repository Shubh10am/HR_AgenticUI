'use server';
/**
 * @fileOverview Screens one resume against a job description and returns an advisory match.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FAIR_HIRING_RULES, ScreenCandidateInputSchema, ScreenCandidateOutputSchema } from '@/ai/schemas/recruitment-definitions';
import { logTokenUsage } from '@/services/usageService';
import { resolveAiContext } from '@/ai/runtime';

const InputSchema = ScreenCandidateInputSchema.extend({
  authToken: z.string().optional().nullable().describe('The caller\'s sign-in token. The organization, user and AI key are derived from it on the server.'),
});

export type ScreenCandidateInput = z.infer<typeof InputSchema>;
export type ScreenCandidateOutput = z.infer<typeof ScreenCandidateOutputSchema>;

export async function screenCandidate(input: ScreenCandidateInput): Promise<ScreenCandidateOutput> {
  return screenCandidateFlow(input);
}

const screenCandidateFlow = ai.defineFlow(
  { name: 'screenCandidateFlow', inputSchema: InputSchema, outputSchema: ScreenCandidateOutputSchema },
  async (input) => {
    const { authToken, jobDescription, resumeText } = input;
    // Identity and key come from the verified token, not from the client-supplied ids.
    const { runner, model, userId, organizationId } = await resolveAiContext(authToken);

    const response = await runner.generate({
      model,
      prompt: `You are an experienced, fair technical recruiter screening a candidate against a job.

${FAIR_HIRING_RULES}

Compare the resume to the job description. Separate must-have requirements from nice-to-haves, and score mainly on must-haves.
Quote or paraphrase concrete evidence. Never invent experience the resume does not show.

JOB DESCRIPTION:
"""${jobDescription}"""

RESUME:
"""${resumeText}"""`,
      output: { schema: ScreenCandidateOutputSchema },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({ employeeId: userId, organizationId, feature: 'screenCandidateFlow', usage: response.usage });
    }
    if (!response.output) throw new Error('Screening failed: no output from the model.');
    return response.output;
  }
);
