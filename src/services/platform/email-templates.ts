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
    subject: 'You\'re in! 🚀 Your HR workspace for {{organizationName}}',
    body: '{{organizationName}} is officially set up on HR Streamline AI, and your admin account is ready to go.\n\nEverything your HR team needs now lives in one place: people, attendance, leave, hiring and an AI copilot that actually knows your policies. Start with the three quick steps below.',
  },
  {
    key: 'welcome-employee',
    name: 'Employee invite',
    description: 'Sent when an admin adds an employee. A "Set your password" button is added below the text.',
    variables: ['name', 'organizationName', 'email'],
    subject: 'Welcome to {{organizationName}} 🎉 Let\'s set up your account',
    body: 'Your {{organizationName}} account on HR Streamline AI is ready. It\'s where you\'ll handle leave, attendance, payslips and team updates, plus ask the AI copilot anything about company policy.\n\nOne quick thing first: choose a password using the button below. If the link expires, use \"Forgot password\" on the sign-in page or ask your admin to resend the invite.',
  },
  {
    key: 'password-reset',
    name: 'Password reset',
    description: 'Sent when someone asks to reset their password. A "Reset Your Password" button is added below the text.',
    variables: ['name'],
    subject: 'Reset your password 🔐',
    body: 'Someone (hopefully you!) asked to reset the password for your account. Tap the button below to choose a new one.',
  },
  {
    key: 'contact-confirmation',
    name: 'Contact form confirmation',
    description: 'Sent to someone who submits the public contact form.',
    variables: ['name', 'subject'],
    subject: 'Got it! We\'ll reply about \"{{subject}}\" soon 💬',
    body: 'Thanks for reaching out. Your message about \"{{subject}}\" has landed with our team and a real person will reply soon.\n\nNo need to send it again. If you have more to add, just reply to this email.',
  },
  {
    key: 'demo-confirmation',
    name: 'Demo request confirmation',
    description: 'Sent to someone who requests a demo.',
    variables: ['name', 'companyName'],
    subject: 'Your HR Streamline AI demo is in the works 📅',
    body: 'Thanks for your interest in HR Streamline AI! We\'ve got your demo request for {{companyName}}.\n\nWe\'ll show you how teams use it for onboarding, attendance, hiring and AI-powered HR answers, tailored to how your team works.',
  },
  {
    key: 'platform-admin-welcome',
    name: 'Platform admin welcome',
    description: 'Sent when a new platform administrator is created. A "Sign in" button is added below the text.',
    variables: ['email'],
    subject: 'You\'re now a platform admin 🛡️',
    body: 'You\'ve been given platform administrator access to HR Streamline AI, so you can manage organizations, users, settings and content across the platform.\n\nFor security, your temporary password isn\'t in this email. The admin who added you will share it separately.',
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
