import dbConnect from '@/lib/mongodb';
import EmailTemplate from '@/models/EmailTemplate';

export interface TemplateDefinition {
  key: string;
  name: string;
  description: string;
  variables: string[];
  subject: string;
  body: string;
}

/**
 * The emails the platform sends, with their built-in wording. Bodies are plain
 * text: {{variable}} placeholders are filled in (and HTML-escaped) and line
 * breaks are kept. Buttons such as "Reset Your Password" are added by the mailer.
 */
export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    key: 'welcome-organization',
    name: 'Organization welcome',
    description: 'Sent to the admin who registers a new organization.',
    variables: ['name', 'organizationName', 'organizationId'],
    subject: 'Welcome to HR Streamline AI, {{organizationName}}!',
    body: 'Your organization, {{organizationName}}, has been successfully registered on the HR Streamline AI platform. Your administrator account is now active.\n\nYou can log in at any time to start managing your employees, setting up integrations, and exploring our AI-powered features. Your Organization ID is: {{organizationId}}.\n\nWe\'re excited to have you on board!',
  },
  {
    key: 'welcome-employee',
    name: 'Employee welcome',
    description: 'Sent when an admin adds an employee, with their sign-in details.',
    variables: ['name', 'organizationName', 'email', 'password'],
    subject: 'Welcome to {{organizationName}}! Your HR Streamline AI Account is Ready',
    body: 'An account has been created for you on the HR Streamline AI platform for your organization, {{organizationName}}. You can now log in using the following credentials:\n\nEmail: {{email}}\nPassword: {{password}}\n\nWe recommend changing your password after your first login via the \'Profile\' section of the dashboard.\n\nWelcome aboard!',
  },
  {
    key: 'password-reset',
    name: 'Password reset',
    description: 'Sent when someone asks to reset their password. A "Reset Your Password" button is added below the text.',
    variables: ['name'],
    subject: 'Reset Your HR Streamline AI Password',
    body: 'We received a request to reset the password for your account. Please click the button below to set a new password. This link is valid for 10 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.',
  },
  {
    key: 'contact-confirmation',
    name: 'Contact form confirmation',
    description: 'Sent to someone who submits the public contact form.',
    variables: ['name', 'subject'],
    subject: 'Thank you for contacting HR Streamline AI',
    body: 'We have received your message regarding "{{subject}}" and will get back to you as soon as possible.',
  },
  {
    key: 'demo-confirmation',
    name: 'Demo request confirmation',
    description: 'Sent to someone who requests a demo.',
    variables: ['name', 'companyName'],
    subject: 'Your Demo Request with HR Streamline AI',
    body: 'Thank you for your interest in HR Streamline AI! We have received your request for a demo. Our team will review your information and reach out shortly to schedule a time that works for you.',
  },
  {
    key: 'platform-admin-welcome',
    name: 'Platform admin welcome',
    description: 'Sent when a new platform administrator is created.',
    variables: ['email', 'password'],
    subject: 'Your HR Streamline AI Platform Admin Account',
    body: 'An administrator account has been created for you on the HR Streamline AI platform. You can now log in using the following credentials:\n\nEmail: {{email}}\nPassword: {{password}}\n\nIt is highly recommended that you change your password upon your first login. You can log in at the main application login page.',
  },
];

const DEFINITIONS = new Map(TEMPLATE_DEFINITIONS.map((definition) => [definition.key, definition]));

export function getTemplateDefinition(key: string): TemplateDefinition | undefined {
  return DEFINITIONS.get(key);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fill(template: string, variables: Record<string, string>, escape: boolean): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    const value = variables[name] ?? '';
    return escape ? escapeHtml(value) : value;
  });
}

/** Lists every template with the admin's saved version where there is one. */
export async function listTemplates() {
  await dbConnect();
  const saved = new Map((await EmailTemplate.find().lean()).map((template) => [template.key, template]));
  return TEMPLATE_DEFINITIONS.map((definition) => {
    const custom = saved.get(definition.key);
    return {
      ...definition,
      defaultSubject: definition.subject,
      defaultBody: definition.body,
      subject: custom?.subject ?? definition.subject,
      body: custom?.body ?? definition.body,
      isCustomized: Boolean(custom),
      updatedAt: custom?.updatedAt ? new Date(custom.updatedAt).toISOString() : null,
    };
  });
}

/**
 * The subject (plain text) and body (HTML) of one email, ready to send.
 * Falls back to the built-in wording if the saved version can't be read.
 */
export async function renderTemplate(key: string, variables: Record<string, string>): Promise<{ subject: string; html: string }> {
  const definition = DEFINITIONS.get(key);
  if (!definition) throw new Error(`Unknown email template "${key}".`);
  let source = { subject: definition.subject, body: definition.body };
  try {
    await dbConnect();
    const custom = await EmailTemplate.findOne({ key }).lean();
    if (custom) source = { subject: custom.subject, body: custom.body };
  } catch (error) {
    console.error(`[email-templates] Using the default "${key}" template:`, error);
  }
  return {
    subject: fill(source.subject, variables, false).replace(/[\r\n]+/g, ' '),
    html: fill(source.body, variables, true).replace(/\n/g, '<br>'),
  };
}

/** Saves an edited template; `null` subject and body restore the default. */
export async function saveTemplate(key: string, subject: string | null, body: string | null, updatedBy: string) {
  await dbConnect();
  if (subject === null || body === null) {
    await EmailTemplate.deleteOne({ key });
    return;
  }
  await EmailTemplate.findOneAndUpdate({ key }, { $set: { subject, body, updatedBy } }, { upsert: true });
}
