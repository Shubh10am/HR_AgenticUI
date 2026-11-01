
'use server';

import * as brevo from '@getbrevo/brevo';
import type { IContactSubmission } from '@/models/ContactSubmission';
import type { IDemoRequest } from '@/models/DemoRequest';
import type { IOrganization } from '@/models/Organization';
import type { IEmployee } from '@/models/Employee';
import { getPlatformSettingsSafe } from '@/services/platform/settings';
import { renderTemplate } from '@/services/platform/email-templates';
import { notifySlack } from '@/services/platform/slack';
import { renderAdminNotification, renderUserEmail } from '@/services/email/layout';

// Used only if platform settings can't be read; the live values are edited in Admin → System Settings.
const FALLBACK = {
  senderEmail: 'noreply@agentic-hr.in',
  senderName: 'HR Streamline AI',
  adminNotificationEmail: 'support@agentic-hr.in',
  appName: 'HR Streamline AI',
};
/** Where email buttons point; set NEXT_PUBLIC_APP_URL in production. */
const appUrl = (path: string) => `${(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002').replace(/\/+$/, '')}${path}`;

const ADMIN_NOTIFICATION_NAME = 'HR Streamline Support';

type NotificationKind = 'notifyOnNewOrganization' | 'notifyOnContact' | 'notifyOnDemoRequest';

let apiInstance: brevo.TransactionalEmailsApi | null = null;

if (process.env.BREVO_API_KEY) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
} else {
  console.warn('BREVO_API_KEY is not set. Email notifications will be disabled.');
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


/** The subject and full HTML of a user-facing email, without sending it (also used by tests and previews). */
export async function buildTemplatedEmail(
  recipientName: string,
  key: string,
  title: string,
  variables: Record<string, string>,
  cta?: { link: string; text: string },
): Promise<{ subject: string; html: string }> {
  const [settings, rendered] = await Promise.all([getPlatformSettingsSafe(), renderTemplate(key, variables)]);
  return {
    subject: rendered.subject,
    html: renderUserEmail({ key, appName: settings?.appName || FALLBACK.appName, recipientName, variables, bodyHtml: rendered.html, cta }),
  };
}

/** Sends a user-facing email from an editable template, wrapped in the standard layout. */
async function sendTemplatedEmail(
  to: { name: string; email: string },
  key: string,
  title: string,
  variables: Record<string, string>,
  cta?: { link: string; text: string },
) {
  const { subject, html } = await buildTemplatedEmail(to.name, key, title, variables, cta);
  await sendEmail(to, subject, html);
}

/** Emails the platform team (and posts to Slack) when that kind of notification is switched on. */
async function notifyPlatformTeam(kind: NotificationKind, subject: string, title: string, fields: { label: string; value: string }[]) {
  const settings = await getPlatformSettingsSafe();
  if (settings && !settings[kind]) return;
  const appName = settings?.appName || FALLBACK.appName;
  const admin = { name: ADMIN_NOTIFICATION_NAME, email: settings?.adminNotificationEmail || FALLBACK.adminNotificationEmail };
  await Promise.all([
    sendEmail(admin, subject, renderAdminNotification({ appName, title, fields })),
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
  }, { link: appUrl('/login'), text: 'Sign in' });
}

export async function sendRegistrationAdminNotification(org: IOrganization, adminUser: IEmployee) {
  await notifyPlatformTeam('notifyOnNewOrganization', `New Organization Registered: ${org.name}`, 'New Organization Registration', [
    { label: 'Organization Name', value: org.name },
    { label: 'Organization ID', value: String(org._id) },
    { label: 'Admin Name', value: adminUser.name },
    { label: 'Admin Email', value: adminUser.email },
  ]);
}

/** The password is never emailed; whoever created the account shares it separately. */
export async function sendNewPlatformAdminWelcomeEmail(email: string) {
  await sendTemplatedEmail({ name: 'New Admin', email }, 'platform-admin-welcome', 'Welcome to the Admin Team!', { email }, { link: appUrl('/login'), text: 'Sign in' });
}

/** The employee invite: no password in the email, just a one-time link to set one. */
export async function sendEmployeeInviteEmail(employee: { name: string; email: string }, organizationName: string, setPasswordUrl: string, deliverTo?: { name: string; email: string }) {
  await sendTemplatedEmail(deliverTo ?? employee, 'welcome-employee', `Welcome, ${employee.name}!`, {
    name: employee.name,
    organizationName,
    email: employee.email,
  }, { link: setPasswordUrl, text: 'Set your password' });
}

export async function sendPasswordResetEmail(user: { name: string; email: string }, resetUrl: string) {
  await sendTemplatedEmail(user, 'password-reset', 'Password Reset Request', { name: user.name }, { link: resetUrl, text: 'Reset Your Password' });
}
