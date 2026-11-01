/** A real screenshot of a module, shown at the top of its guide. */
export interface DocScreenshot {
  src: string;
  alt: string;
  caption: string;
}

const shot = (file: string, alt: string, caption: string): DocScreenshot => ({ src: `/docs/screenshots/${file}`, alt, caption });

/**
 * Screenshots by doc slug. Captured from the running app with test accounts and
 * sample data; personal content (real mailboxes, API key hints) is blurred.
 */
export const DOC_SCREENSHOTS: Record<string, DocScreenshot> = {
  introduction: shot('dashboard.jpg', 'HR Streamline AI dashboard with greeting, key numbers and quick actions', 'The dashboard is your starting point: today’s numbers, quick actions and service status.'),
  navigating: shot('dashboard.jpg', 'Dashboard with the collapsed sidebar on the left', 'The sidebar groups every module; the header holds Copilot and your user menu.'),
  'ai-overview': shot('settings.jpg', 'AI Provider settings with provider choices such as Gemini, Claude, OpenAI and Grok', 'Admins choose the AI provider and model that power every AI feature.'),
  'account-security': shot('profile.jpg', 'User profile page with account details', 'Your profile shows your role and organization; change your password from Settings.'),
  'gmail-inbox': shot('gmail-inbox.jpg', 'Gmail inbox with folders, category tabs and the AI reply tip (message list blurred)', 'Folders on the left, categories and the “Reply with AI” tip above your mail. Message contents are blurred in this screenshot.'),
  'email-assistance': shot('email-assistance.jpg', 'Email Assistance with the employee query box and generated drafts panel', 'Paste an employee’s question on the left; draft replies appear on the right.'),
  'smart-drafting': shot('smart-drafting.jpg', 'Smart Drafting with the prompt box and the email composer', 'Describe the email on the left, then edit and send it from the composer.'),
  community: shot('community.jpg', 'Community Hub with the new post form, events and birthdays', 'Share updates with your organization; upcoming events and birthdays sit on the right.'),
  'unified-communications': shot('unified-communications.jpg', 'Unified Communications hub with connected platforms and recent logs', 'Preview: connected platforms and a combined log of recent communication (sample data).'),
  recruitment: shot('recruitment.jpg', 'AI Recruitment with tabs for job creation, resume filtering, ATS score, applications and AI interviewer', 'Each recruitment tool has its own tab, starting with the AI job description generator.'),
  'manage-employees': shot('manage-employees.jpg', 'Manage Employees with the registration form and employee list', 'Register people on the left; search, filter and edit them on the right. Bulk Register imports a CSV.'),
  'my-attendance': shot('my-attendance.jpg', 'Attendance and Reporting with clock in/out, leave request and monthly snapshot', 'Clock in and out, request leave and see your month at a glance.'),
  'attendance-management': shot('attendance-management.jpg', 'Attendance Management showing who is present and absent today', 'A daily view of who has clocked in and who hasn’t.'),
  onboarding: shot('onboarding.jpg', 'Employee Onboarding with the new hire form and onboarding tracker', 'Preview: start onboarding for a new hire and track progress (sample data).'),
  hierarchy: shot('hierarchy.jpg', 'Employee Hierarchy org chart with search and zoom controls', 'Preview: an interactive org chart you can search, zoom and collapse (sample data).'),
  payroll: shot('payroll.jpg', 'Payroll Management with summary cards and payroll history', 'Preview: payroll totals and history by pay period (sample data).'),
  'knowledge-base': shot('knowledge-base.jpg', 'Knowledge Base with the Ask panel, folders and upload actions', 'Ask questions at the top; upload and organize documents below.'),
  tasks: shot('tasks.jpg', 'Task board with To do, In progress, In review and Done columns', 'Drag tasks between columns to track work.'),
  integrations: shot('integrations.jpg', 'Integrations with Gmail, GitHub, Slack, Google Calendar, Zoom and Google Meet cards', 'Connect the services your team uses; each card shows its status.'),
  support: shot('support.jpg', 'Support Center with the new ticket form and ticket history', 'Raise a ticket on the left and follow its status on the right.'),
  settings: shot('settings.jpg', 'Settings with account, notifications, appearance and AI Provider cards', 'Account, notifications, appearance, and the AI Provider your organization uses.'),
  'platform-admin': shot('platform-admin.jpg', 'Admin console Platform Analytics with KPI cards and activity charts', 'The admin console’s analytics: AI usage, user actions and growth across organizations.'),
};
