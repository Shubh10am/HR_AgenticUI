
'use server';

import * as brevo from '@getbrevo/brevo';
import type { IContactSubmission } from '@/models/ContactSubmission';
import type { IDemoRequest } from '@/models/DemoRequest';

const SENDER_EMAIL = 'noreply@agentic-hr.in';
const SENDER_NAME = 'HR Streamline AI';
const NOTIFICATION_RECIPIENT_EMAIL = 'support@agentic-hr.in';
const NOTIFICATION_RECIPIENT_NAME = 'HR Streamline Support';

let apiInstance: brevo.TransactionalEmailsApi | null = null;

if (process.env.BREVO_API_KEY) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
} else {
  console.warn('BREVO_API_KEY is not set. Email notifications will be disabled.');
}

function generateHtmlTemplate(title: string, fields: { label: string; value: string }[]): string {
    const fieldsHtml = fields
        .map(
            (field) => `
    <tr style="border-bottom: 1px solid #dfe3e8;">
        <td style="padding: 12px 15px; font-weight: 600; color: #333; width: 30%;">${field.label}</td>
        <td style="padding: 12px 15px; color: #555;">${field.value}</td>
    </tr>`
        )
        .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <title>${title}</title>
    </head>
    <body style="font-family: 'Poppins', sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                        <tr>
                            <td align="center" style="padding: 25px; background-color: #2c3e50; color: #ffffff;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HR Streamline AI</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px 25px;">
                                <h2 style="margin: 0 0 20px; font-size: 20px; color: #2c3e50;">${title}</h2>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #dfe3e8; border-radius: 8px;">
                                    ${fieldsHtml}
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px; font-size: 12px; color: #7f8c8d; border-top: 1px solid #ecf0f1;">
                                This is an automated notification from HR Streamline AI.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
}


export async function sendContactSubmissionEmail(submission: IContactSubmission) {
  if (!apiInstance) return;

  const fields = [
    { label: 'Name', value: submission.name },
    { label: 'Email', value: submission.email },
    { label: 'Phone', value: submission.phone || 'N/A' },
    { label: 'Subject', value: submission.subject },
    { label: 'Message', value: submission.message },
  ];

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `New Contact Form Submission: ${submission.subject}`;
  sendSmtpEmail.htmlContent = generateHtmlTemplate('New Contact Submission', fields);
  sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
  sendSmtpEmail.to = [{ name: NOTIFICATION_RECIPIENT_NAME, email: NOTIFICATION_RECIPIENT_EMAIL }];
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Contact submission notification sent successfully.');
  } catch (error) {
    console.error('Failed to send contact submission email:', error);
  }
}

export async function sendDemoRequestEmail(request: IDemoRequest) {
  if (!apiInstance) return;
  
  const fields = [
    { label: 'Name', value: request.name },
    { label: 'Company Name', value: request.companyName },
    { label: 'Work Email', value: request.email },
    { label: 'Phone', value: request.phone || 'N/A' },
    { label: 'Company Size', value: request.companySize },
    { label: 'Message', value: request.message || 'N/A' },
  ];

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `New Demo Request from ${request.companyName}`;
  sendSmtpEmail.htmlContent = generateHtmlTemplate('New Demo Request', fields);
  sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
  sendSmtpEmail.to = [{ name: NOTIFICATION_RECIPIENT_NAME, email: NOTIFICATION_RECIPIENT_EMAIL }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Demo request notification sent successfully.');
  } catch (error) {
    console.error('Failed to send demo request email:', error);
  }
}
