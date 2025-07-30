
'use server';

import * as brevo from '@getbrevo/brevo';
import type { IContactSubmission } from '@/models/ContactSubmission';
import type { IDemoRequest } from '@/models/DemoRequest';
import type { IOrganization } from '@/models/Organization';
import type { IEmployee } from '@/models/Employee';

const SENDER_EMAIL = 'noreply@agentic-hr.in';
const SENDER_NAME = 'HR Streamline AI';
const ADMIN_NOTIFICATION_EMAIL = 'support@agentic-hr.in';
const ADMIN_NOTIFICATION_NAME = 'HR Streamline Support';

let apiInstance: brevo.TransactionalEmailsApi | null = null;

if (process.env.BREVO_API_KEY) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
} else {
  console.warn('BREVO_API_KEY is not set. Email notifications will be disabled.');
}

function generateAdminNotificationHtml(title: string, fields: { label: string; value: string }[]): string {
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

function generateUserConfirmationHtml(title: string, name: string, message: string): string {
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
                                <h2 style="margin: 0 0 20px; font-size: 20px; color: #2c3e50;">Hi ${name},</h2>
                                <p style="color: #555; line-height: 1.6;">${message}</p>
                                <br>
                                <p style="color: #555; line-height: 1.6;">Best regards,<br>The HR Streamline AI Team</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px; font-size: 12px; color: #7f8c8d; border-top: 1px solid #ecf0f1;">
                                This is an automated confirmation email.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
}

async function sendEmail(to: { name: string; email: string }, subject: string, htmlContent: string) {
    if (!apiInstance) {
        console.log(`Email not sent to ${to.email} because Brevo API key is not configured.`);
        return;
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: SENDER_NAME, email: SENDER_EMAIL };
    sendSmtpEmail.to = [to];
    
    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email sent successfully to ${to.email}.`);
    } catch (error) {
        console.error(`Failed to send email to ${to.email}:`, error);
    }
}


export async function sendContactConfirmation(submission: IContactSubmission) {
    const user = { name: submission.name, email: submission.email };
    const subject = `Thank you for contacting HR Streamline AI`;
    const message = `We have received your message regarding "${submission.subject}" and will get back to you as soon as possible.`;
    const htmlContent = generateUserConfirmationHtml('Message Received', user.name, message);
    sendEmail(user, subject, htmlContent);
}

export async function sendContactAdminNotification(submission: IContactSubmission) {
    const admin = { name: ADMIN_NOTIFICATION_NAME, email: ADMIN_NOTIFICATION_EMAIL };
    const fields = [
        { label: 'Name', value: submission.name },
        { label: 'Email', value: submission.email },
        { label: 'Phone', value: submission.phone || 'N/A' },
        { label: 'Subject', value: submission.subject },
        { label: 'Message', value: submission.message },
    ];
    const subject = `New Contact Form Submission: ${submission.subject}`;
    const htmlContent = generateAdminNotificationHtml('New Contact Submission', fields);
    sendEmail(admin, subject, htmlContent);
}


export async function sendDemoConfirmation(request: IDemoRequest) {
    const user = { name: request.name, email: request.email };
    const subject = `Your Demo Request with HR Streamline AI`;
    const message = `Thank you for your interest in HR Streamline AI! We have received your request for a demo. Our team will review your information and reach out shortly to schedule a time that works for you.`;
    const htmlContent = generateUserConfirmationHtml('Demo Request Received', user.name, message);
    sendEmail(user, subject, htmlContent);
}

export async function sendDemoAdminNotification(request: IDemoRequest) {
    const admin = { name: ADMIN_NOTIFICATION_NAME, email: ADMIN_NOTIFICATION_EMAIL };
    const fields = [
        { label: 'Name', value: request.name },
        { label: 'Company Name', value: request.companyName },
        { label: 'Work Email', value: request.email },
        { label: 'Phone', value: request.phone || 'N/A' },
        { label: 'Company Size', value: request.companySize },
        { label: 'Message', value: request.message || 'N/A' },
    ];
    const subject = `New Demo Request from ${request.companyName}`;
    const htmlContent = generateAdminNotificationHtml('New Demo Request', fields);
    sendEmail(admin, subject, htmlContent);
}


export async function sendRegistrationWelcomeEmail(org: IOrganization, adminUser: IEmployee) {
    const user = { name: adminUser.name, email: adminUser.email };
    const subject = `Welcome to HR Streamline AI, ${org.name}!`;
    const message = `Your organization, <strong>${org.name}</strong>, has been successfully registered on the HR Streamline AI platform. Your administrator account is now active.<br><br>
                     You can log in at any time to start managing your employees, setting up integrations, and exploring our AI-powered features. Your Organization ID is: <strong>${org._id}</strong>.<br><br>
                     We're excited to have you on board!`;
    const htmlContent = generateUserConfirmationHtml('Welcome Aboard!', user.name, message);
    sendEmail(user, subject, htmlContent);
}

export async function sendRegistrationAdminNotification(org: IOrganization, adminUser: IEmployee) {
    const admin = { name: ADMIN_NOTIFICATION_NAME, email: ADMIN_NOTIFICATION_EMAIL };
    const fields = [
        { label: 'Organization Name', value: org.name },
        { label: 'Organization ID', value: org._id.toString() },
        { label: 'Admin Name', value: adminUser.name },
        { label: 'Admin Email', value: adminUser.email },
    ];
    const subject = `New Organization Registered: ${org.name}`;
    const htmlContent = generateAdminNotificationHtml('New Organization Registration', fields);
    sendEmail(admin, subject, htmlContent);
}
