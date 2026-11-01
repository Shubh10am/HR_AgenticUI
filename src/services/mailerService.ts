
'use server';

import * as brevo from '@getbrevo/brevo';
import type { IContactSubmission } from '@/models/ContactSubmission';
import type { IDemoRequest } from '@/models/DemoRequest';
import type { IOrganization } from '@/models/Organization';
import type { IEmployee } from '@/models/Employee';
import { getPlatformSettingsSafe } from '@/services/platform/settings';
import { renderTemplate } from '@/services/platform/email-templates';
import { notifySlack } from '@/services/platform/slack';

// Used only if platform settings can't be read; the live values are edited in Admin → System Settings.
const FALLBACK = {
  senderEmail: 'noreply@agentic-hr.in',
  senderName: 'HR Streamline AI',
  adminNotificationEmail: 'support@agentic-hr.in',
  appName: 'HR Streamline AI',
};
const ADMIN_NOTIFICATION_NAME = 'HR Streamline Support';

type NotificationKind = 'notifyOnNewOrganization' | 'notifyOnContact' | 'notifyOnDemoRequest';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let apiInstance: brevo.TransactionalEmailsApi | null = null;

if (process.env.BREVO_API_KEY) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
} else {
  console.warn('BREVO_API_KEY is not set. Email notifications will be disabled.');
}

function generateAdminNotificationHtml(title: string, fields: { label: string; value: string }[], appName = FALLBACK.appName): string {
    const fieldsHtml = fields
        .map(
            (field) => `
    <tr style="border-bottom: 1px solid #dfe3e8;">
        <td style="padding: 12px 15px; font-weight: 600; color: #333; width: 30%;">${field.label}</td>
        <td style="padding: 12px 15px; color: #555;">${escapeHtml(field.value)}</td>
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
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${escapeHtml(appName)}</h1>
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
                                This is an automated notification from ${escapeHtml(appName)}.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
}

function generateUserConfirmationHtml(title: string, name: string, message: string, ctaLink?: string, ctaText?: string, appName = FALLBACK.appName): string {
    const ctaButton = ctaLink && ctaText ? `
    <a href="${ctaLink}" target="_blank" style="background-color: #3F51B5; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; margin-top: 20px;">
        ${ctaText}
    </a>` : '';

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
                                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${escapeHtml(appName)}</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px 25px;">
                                <h2 style="margin: 0 0 20px; font-size: 20px; color: #2c3e50;">Hi ${escapeHtml(name)},</h2>
                                <p style="color: #555; line-height: 1.6;">${message}</p>
                                ${ctaButton}
                                <br>
                                <p style="color: #555; line-height: 1.6; margin-top: 30px;">Best regards,<br>The ${escapeHtml(appName)} Team</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px; font-size: 12px; color: #7f8c8d; border-top: 1px solid #ecf0f1;">
                                If you did not request this action, please ignore this email or contact support.
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
    const settings = await getPlatformSettingsSafe();
    sendSmtpEmail.sender = { name: settings?.senderName || FALLBACK.senderName, email: settings?.senderEmail || FALLBACK.senderEmail };
    sendSmtpEmail.to = [to];
    
    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email sent successfully to ${to.email}.`);
    } catch (error) {
        console.error(`Failed to send email to ${to.email}:`, error);
    }
}


/** Sends a user-facing email from an editable template, wrapped in the standard layout. */
async function sendTemplatedEmail(
  to: { name: string; email: string },
  key: string,
  title: string,
  variables: Record<string, string>,
  cta?: { link: string; text: string },
) {
  const [settings, rendered] = await Promise.all([getPlatformSettingsSafe(), renderTemplate(key, variables)]);
  const html = generateUserConfirmationHtml(title, to.name, rendered.html, cta?.link, cta?.text, settings?.appName || FALLBACK.appName);
  await sendEmail(to, rendered.subject, html);
}

/** Emails the platform team (and posts to Slack) when that kind of notification is switched on. */
async function notifyPlatformTeam(kind: NotificationKind, subject: string, title: string, fields: { label: string; value: string }[]) {
  const settings = await getPlatformSettingsSafe();
  if (settings && !settings[kind]) return;
  const appName = settings?.appName || FALLBACK.appName;
  const admin = { name: ADMIN_NOTIFICATION_NAME, email: settings?.adminNotificationEmail || FALLBACK.adminNotificationEmail };
  await Promise.all([
    sendEmail(admin, subject, generateAdminNotificationHtml(title, fields, appName)),
    notifySlack(`*${title}*\n${fields.map((field) => `• ${field.label}: ${field.value}`).join('\n')}`),
  ]);
}

export async function sendContactConfirmation(submission: IContactSubmission) {
  await sendTemplatedEmail({ name: submission.name, email: submission.email }, 'contact-confirmation', 'Message Received', {
    name: submission.name,
    subject: submission.subject,
  });
}

export async function sendContactAdminNotification(submission: IContactSubmission) {
  await notifyPlatformTeam('notifyOnContact', `New Contact Form Submission: ${submission.subject}`, 'New Contact Submission', [
    { label: 'Name', value: submission.name },
    { label: 'Email', value: submission.email },
    { label: 'Phone', value: submission.phone || 'N/A' },
    { label: 'Subject', value: submission.subject },
    { label: 'Message', value: submission.message },
  ]);
}

export async function sendDemoConfirmation(request: IDemoRequest) {
  await sendTemplatedEmail({ name: request.name, email: request.email }, 'demo-confirmation', 'Demo Request Received', {
    name: request.name,
    companyName: request.companyName,
  });
}

export async function sendDemoAdminNotification(request: IDemoRequest) {
  await notifyPlatformTeam('notifyOnDemoRequest', `New Demo Request from ${request.companyName}`, 'New Demo Request', [
    { label: 'Name', value: request.name },
    { label: 'Company Name', value: request.companyName },
    { label: 'Work Email', value: request.email },
    { label: 'Phone', value: request.phone || 'N/A' },
    { label: 'Company Size', value: request.companySize },
    { label: 'Message', value: request.message || 'N/A' },
  ]);
}

export async function sendRegistrationWelcomeEmail(org: IOrganization, adminUser: IEmployee) {
  await sendTemplatedEmail({ name: adminUser.name, email: adminUser.email }, 'welcome-organization', 'Welcome Aboard!', {
    name: adminUser.name,
    organizationName: org.name,
    organizationId: String(org._id),
  });
}

export async function sendRegistrationAdminNotification(org: IOrganization, adminUser: IEmployee) {
  await notifyPlatformTeam('notifyOnNewOrganization', `New Organization Registered: ${org.name}`, 'New Organization Registration', [
    { label: 'Organization Name', value: org.name },
    { label: 'Organization ID', value: String(org._id) },
    { label: 'Admin Name', value: adminUser.name },
    { label: 'Admin Email', value: adminUser.email },
  ]);
}

export async function sendNewPlatformAdminWelcomeEmail(email: string, password_provided: string) {
  await sendTemplatedEmail({ name: 'New Admin', email }, 'platform-admin-welcome', 'Welcome to the Admin Team!', {
    email,
    password: password_provided,
  });
}

export async function sendNewEmployeeWelcomeEmail(employee: { name: string; email: string }, organizationName: string, password_provided: string) {
  await sendTemplatedEmail({ name: employee.name, email: employee.email }, 'welcome-employee', `Welcome, ${employee.name}!`, {
    name: employee.name,
    organizationName,
    email: employee.email,
    password: password_provided,
  });
}

export async function sendPasswordResetEmail(user: { name: string; email: string }, resetUrl: string) {
  await sendTemplatedEmail(user, 'password-reset', 'Password Reset Request', { name: user.name }, { link: resetUrl, text: 'Reset Your Password' });
}
