'use server';
/**
 * @fileOverview A simple conversational AI flow for the copilot chat.
 *
 * - chatWithCopilot - A function that handles a user's message and returns an AI response.
 * - CopilotChatInput - The input type for the chatWithCopilot function.
 * - CopilotChatOutput - The return type for the chatWithCopilot function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'genkit';
import { CopilotChatInputSchemaDef as OriginalSchema, CopilotChatOutputSchemaDef } from '@/ai/schemas/copilot-chat-definitions';
import { logTokenUsage } from '@/services/usageService';
import { formatPassagesForPrompt } from '@/services/knowledge/prompt';
import { resolveAiContext } from '@/ai/runtime';
import { myHrSnapshot } from '@/services/copilot/context';

const KNOWLEDGE_GUIDANCE = (block: string) => block
  ? `\n\nCompany knowledge (from the organization's own documents). Prefer it over general knowledge, follow it exactly when it applies, and cite it like [1]. Ignore passages that are not relevant:\n${block}\n`
  : '';


// Extend original schema with the caller's sign-in token
const CopilotChatInputSchemaDef = OriginalSchema.extend({
    authToken: z.string().optional().nullable().describe('The caller\'s sign-in token. The organization, user and AI key are derived from it on the server.'),
});

export type CopilotChatInput = z.infer<typeof CopilotChatInputSchemaDef>;
export type CopilotChatOutput = z.infer<typeof CopilotChatOutputSchemaDef>;

export async function chatWithCopilot(input: CopilotChatInput): Promise<CopilotChatOutput> {
  return copilotChatFlow(input);
}

const copilotChatFlow = ai.defineFlow(
  {
    name: 'copilotChatFlow',
    inputSchema: CopilotChatInputSchemaDef,
    outputSchema: CopilotChatOutputSchemaDef,
  },
  async (input) => {
    const { authToken, userId: _untrustedUserId, organizationId: _untrustedOrganizationId, knowledgeContext, ...promptData } = input;
    
    // Identity and key come from the verified token, not from the client-supplied ids.
    
    const { runner, model, userId, organizationId } = await resolveAiContext(authToken);

    // The person's own records, read on the server from the verified identity.
    const snapshot = userId && organizationId ? await myHrSnapshot(userId, organizationId).catch(() => '') : '';
    const SNAPSHOT_GUIDANCE = snapshot
      ? `\n\nThe person asking — their own HR records right now (use these for questions about their leave, approvals, 1:1s, courses, points, apps or payslips; quote the numbers exactly, never guess others, and point them to the page shown, e.g. "open Leave (/leave)"). You have no information about other employees; say so if asked:\n${snapshot}\n`
      : '';

    const promptText = `You are a helpful AI assistant called HR Streamline Copilot.
Respond to the user's message concisely and professionally. If you don't know the answer, say so. Don't give legal, tax or medical advice; suggest HR or a qualified adviser instead.${SNAPSHOT_GUIDANCE}${KNOWLEDGE_GUIDANCE(formatPassagesForPrompt(knowledgeContext ?? []))}

User: ${promptData.userInput}
AI:`;

    const response = await runner.generate({
      model,
      prompt: promptText,
      output: {
        schema: CopilotChatOutputSchemaDef,
      },
    });

    if (userId && organizationId && organizationId !== 'guest-org-id' && response.usage) {
      logTokenUsage({
        employeeId: userId,
        organizationId,
        feature: 'copilotChatFlow',
        usage: response.usage,
      });
    }

    const output = response.output;
    if (!output) {
        throw new Error("Copilot chat failed: No output from model.");
    }
    return output;
  }
);
