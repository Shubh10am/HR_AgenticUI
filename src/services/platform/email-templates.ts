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
    description: 'Sent to the admin who registers a new organization. A "Sign in" button is added below the text.',
    variables: ['name', 'organizationName', 'organizationId'],
    subject: 'Welcome to HR Streamline AI, {{organizationName}}!',
    body: 'Your organization, {{organizationName}}, is set up on HR Streamline AI and your administrator account is active.\n\nGood first steps:\n1. Add your team in Manage Employees, one at a time or from a CSV. Each person gets an email with a link to set their own password.\n2. Choose your AI provider in Settings.\n3. Connect Google and other tools in Integrations.\n\nYour Organization ID is {{organizationId}}. Keep it handy if you contact support.\n\nWe\'re excited to have you on board!',
  },
  {
    key: 'welcome-employee',
    name: 'Employee invite',
    description: 'Sent when an admin adds an employee. A "Set your password" button is added below the text.',
    variables: ['name', 'organizationName', 'email'],
    subject: 'Welcome to {{organizationName}}! Set up your HR Streamline AI account',
    body: 'An account has been created for you on the HR Streamline AI platform for your organization, {{organizationName}}.\n\nYour sign-in email is {{email}}. Click the button below to choose your password. The link works once and expires in 72 hours; if it expires, use "Forgot password" on the sign-in page or ask your admin to resend the invite.\n\nWelcome aboard!',
  },
  {
    key: 'password-reset',
    name: 'Password reset',
    description: 'Sent when someone asks to reset their password. A "Reset Your Password" button is added below the text.',
    variables: ['name'],
    subject: 'Reset Your HR Streamline AI Password',
    body: 'We received a request to reset the password for your account. Please click the button below to set a new password. This link is valid for 30 minutes and works once.\n\nIf you did not request a password reset, you can safely ignore this email.',
  },
  {
    key: 'contact-confirmation',
    name: 'Contact form confirmation',
    description: 'Sent to someone who submits the public contact form.',
    variables: ['name', 'subject'],
    subject: 'We received your message: {{subject}}',
    body: 'Thank you for getting in touch. We have received your message about "{{subject}}" and a member of our team will reply within one business day.\n\nYou don\'t need to send it again. If you have more details to add, simply reply to this email.',
  },
  {
    key: 'demo-confirmation',
    name: 'Demo request confirmation',
    description: 'Sent to someone who requests a demo.',
    variables: ['name', 'companyName'],
    subject: 'Your Demo Request with HR Streamline AI',
    body: 'Thank you for your interest in HR Streamline AI! We have received the demo request for {{companyName}}.\n\nOur team will reach out within one business day to find a time that suits you. The demo takes about 30 minutes and covers employee management, attendance, recruitment and the AI assistants, tailored to your team.',
  },
  {
    key: 'platform-admin-welcome',
    name: 'Platform admin welcome',
    description: 'Sent when a new platform administrator is created. A "Sign in" button is added below the text.',
    variables: ['email'],
    subject: 'Your HR Streamline AI Platform Admin Account',
    body: 'A platform administrator account has been created for you on HR Streamline AI.\n\nYour sign-in email is {{email}}. For security, your temporary password is not included in this email: the administrator who created your account will share it with you separately.\n\nPlease change it after your first sign-in from your Profile.',
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
