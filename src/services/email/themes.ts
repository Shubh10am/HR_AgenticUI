// Per-email look: the hero, key facts and next steps that frame each template's text.
// The text itself stays editable in Admin → Content → Email templates.

export interface EmailTheme {
  emoji: string;
  /** Small label above the headline. */
  eyebrow: string;
  headline: (v: Record<string, string>) => string;
  /** Hero gradient, start → end. The first colour is the fallback for clients without gradients. */
  gradient: [string, string];
  facts?: (v: Record<string, string>) => { label: string; value: string }[];
  steps?: string[];
  /** Why the person is getting this email. */
  reason: (v: Record<string, string>) => string;
}

const VIOLET: [string, string] = ['#6D28D9', '#DB2777'];
const OCEAN: [string, string] = ['#2563EB', '#06B6D4'];
const SUNSET: [string, string] = ['#EA580C', '#DB2777'];
const MINT: [string, string] = ['#059669', '#0EA5E9'];
const NIGHT: [string, string] = ['#111827', '#6D28D9'];

export const EMAIL_THEMES: Record<string, EmailTheme> = {
  'welcome-employee': {
    emoji: '🎉', eyebrow: 'Welcome to the team', gradient: VIOLET,
    headline: (v) => `Your ${v.organizationName || 'team'} account is ready`,
    facts: (v) => [
      { label: 'Sign-in email', value: v.email },
      { label: 'Link expires', value: 'in 72 hours' },
      { label: 'Works', value: 'once' },
    ],
    steps: ['Set your password', 'Add a photo and check your profile', 'Say hi to the team in Community'],
    reason: (v) => `You're getting this because an admin at ${v.organizationName || 'your company'} added you.`,
  },
  'welcome-organization': {
    emoji: '🚀', eyebrow: 'Workspace is live', gradient: OCEAN,
    headline: (v) => `${v.organizationName || 'Your workspace'} is all set`,
    facts: (v) => [{ label: 'Organization ID', value: v.organizationId }],
    steps: ['Invite your team from Manage Employees', 'Choose your AI provider in Settings', 'Connect Google in Integrations'],
    reason: () => 'You’re getting this because you registered a new organization.',
  },
  'password-reset': {
    emoji: '🔐', eyebrow: 'Account security', gradient: NIGHT,
    headline: () => 'Let’s get you back in',
    facts: () => [{ label: 'Link expires', value: 'in 30 minutes' }, { label: 'Works', value: 'once' }],
    reason: () => 'Didn’t ask for this? You can ignore this email. Your password won’t change.',
  },
  'contact-confirmation': {
    emoji: '💬', eyebrow: 'Message received', gradient: MINT,
    headline: () => 'Thanks, we’ve got it',
    facts: (v) => [{ label: 'Topic', value: v.subject }, { label: 'Reply within', value: '1 business day' }],
    reason: () => 'You’re getting this because you contacted us through our website.',
  },
  'demo-confirmation': {
    emoji: '📅', eyebrow: 'Demo requested', gradient: SUNSET,
    headline: () => 'Your demo is in the works',
    facts: (v) => [{ label: 'Company', value: v.companyName }, { label: 'Length', value: 'about 30 minutes' }],
    steps: ['We’ll email you within one business day', 'Pick a time that suits you', 'See it tailored to your team'],
    reason: () => 'You’re getting this because you requested a demo on our website.',
  },
  'platform-admin-welcome': {
    emoji: '🛡️', eyebrow: 'Admin access', gradient: NIGHT,
    headline: () => 'You’re a platform admin now',
    facts: (v) => [{ label: 'Sign-in email', value: v.email }],
    steps: ['Get your temporary password from the admin who added you', 'Sign in and change it from your Profile', 'Explore the admin console'],
    reason: () => 'You’re getting this because a platform administrator gave you access.',
  },
};

export const DEFAULT_THEME: EmailTheme = {
  emoji: '✨', eyebrow: 'Update', gradient: VIOLET, headline: () => 'A quick update', reason: () => 'You’re getting this because you have an account with us.',
};
