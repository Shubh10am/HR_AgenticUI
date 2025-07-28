
// This file is NOT 'use server'
import {z} from 'genkit';

export const GenerateDraftEmailResponsesInputSchemaDef = z.object({
  query: z.string().describe('The employee inquiry or request, or a prompt for a new email.'),
  userId: z.string().optional().describe("The ID of the user making the request for logging."),
  organizationId: z.string().optional().nullable().describe("The ID of the organization for logging."),
  prompt: z.string().optional().describe('An optional, short prompt for a specific reply instruction.'),
});

export const DraftEmailSchemaDef = z.object({
  subject: z.string().describe('A concise and relevant subject line for the email.'),
  body: z.string().describe('The full body content of the email draft.'),
});

export const GenerateDraftEmailResponsesOutputSchemaDef = z.object({
  drafts: z.array(DraftEmailSchemaDef).describe('An array of draft emails, each with a subject and body.'),
});
