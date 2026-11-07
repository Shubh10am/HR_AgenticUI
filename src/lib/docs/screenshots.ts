/** A real screenshot of a module, shown at the top of its guide. */
export interface DocScreenshot {
  src: string;
  alt: string;
  caption: string;
}

const shot = (file: string, alt: string, caption: string): DocScreenshot => ({ src: `/docs/screenshots/${file}`, alt, caption });

/**
 * Screenshots by doc slug. Captured from the running app with test accounts and
 * sample data at 2880×1800; personal content (real mailboxes, API key hints) is blurred.
 */
export const DOC_SCREENSHOTS: Record<string, DocScreenshot> = {
  introduction: shot('dashboard.jpg', 'HR Streamline AI dashboard with greeting, key numbers and quick actions', 'The dashboard is your starting point: today’s numbers, quick actions and service status.'),
  navigating: shot('dashboard.jpg', 'Dashboard with the collapsed sidebar on the left', 'The sidebar groups every module; the header holds Copilot and your user menu.'),
  'ai-overview': shot('settings.jpg', 'AI Provider settings with provider choices such as Gemini, Claude, OpenAI and Grok', 'Admins choose the AI provider and model that power every AI feature.'),
  'account-security': shot('profile.jpg', 'User profile page with account details', 'Your profile shows your role and organization; change your password from Settings.'),
  'gmail-inbox': shot('gmail-inbox.jpg', 'Gmail inbox with folders, category tabs and the AI reply tip (message list blurred)', 'Folders on the left, categories and the “Reply with AI” tip above your mail. Message contents are blurred in this screenshot.'),
  'email-assistance': shot('email-assistance.jpg', 'Email Assistance with the employee query box and generated drafts panel', 'Paste an employee’s question on the left; draft replies appear on the right.'),
  'smart-drafting': shot('smart-drafting.jpg', 'Smart Drafting with the prompt box and the email composer', 'Describe the email on the left, then edit and send it from the composer.'),
  community: shot('community.jpg', 'Community feed with post types, an announcement with a read receipt, and celebrations on the right', 'Post updates, kudos, polls and events; announcements show how many colleagues have read them.'),
  'unified-communications': shot('unified-communications.jpg', 'Unified Communications hub with connected platforms and recent logs', 'Preview: connected platforms and a combined log of recent communication (sample data).'),
  recruitment: shot('recruitment.jpg', 'AI Recruitment with tabs for job creation, resume filtering, ATS score, applications and AI interviewer', 'Each recruitment tool has its own tab, starting with the AI job description generator.'),
  'manage-employees': shot('manage-employees.jpg', 'Manage Employees with the registration form and employee list', 'Register people on the left; search, filter and edit them on the right. Bulk Register imports a CSV.'),
  'my-attendance': shot('my-attendance.jpg', 'My Attendance with clock in/out, today’s shift and monthly snapshot', 'Clock in and out and see your month at a glance; time off is requested on the Leave page.'),
  'attendance-management': shot('attendance-management.jpg', 'Attendance Management showing who is present and absent today', 'A daily view of who has clocked in and who hasn’t.'),
  onboarding: shot('onboarding.jpg', 'Employee Onboarding with the new hire form and onboarding tracker', 'Preview: start onboarding for a new hire and track progress (sample data).'),
  hierarchy: shot('hierarchy.jpg', 'Employee Hierarchy org chart with search and zoom controls', 'Preview: an interactive org chart you can search, zoom and collapse (sample data).'),
  payroll: shot('payroll.jpg', 'Payroll page with pay runs by month and a draft month’s payslips table', 'Prepare a month, check every payslip, then publish. Each person sees only their own.'),
  'knowledge-base': shot('knowledge-base.jpg', 'Knowledge Base with the Ask panel, folders and upload actions', 'Ask questions at the top; upload and organize documents below.'),
  tasks: shot('tasks.jpg', 'Task board with To do, In progress, In review and Done columns', 'Drag tasks between columns to track work.'),
  integrations: shot('integrations.jpg', 'Integrations with Gmail, GitHub, Slack, Google Calendar, Zoom and Google Meet cards', 'Connect the services your team uses; each card shows its status.'),
  support: shot('support.jpg', 'Support Center with the new ticket form and ticket history', 'Raise a ticket on the left and follow its status on the right.'),
  settings: shot('settings.jpg', 'Settings with account, notifications, appearance and AI Provider cards', 'Account, notifications, appearance, and the AI Provider your organization uses.'),
  'platform-admin': shot('platform-admin.jpg', 'Admin console Platform Analytics with KPI cards and activity charts', 'The admin console’s analytics: AI usage, user actions and growth across organizations.'),
  approvals: shot('approvals.jpg', 'Approvals inbox with request tabs and an approval timeline', 'Every request waiting on you, with who has already approved it.'),
  leave: shot('leave.jpg', 'Leave page with balance cards, requests and tabs for Who’s away and Holidays', 'Balances at the top; requests, the team calendar and holidays in tabs.'),
  timesheets: shot('timesheets.jpg', 'Weekly timesheet grid with projects and daily hours', 'Log hours per project and day, then submit the week.'),
  shifts: shot('shifts.jpg', 'Shifts page with shift types and the weekly roster', 'Shift types and who works which shift this week.'),
  expenses: shot('expenses.jpg', 'Expenses with claims and their status', 'Claims with their amount, category and status.'),
  assets: shot('assets.jpg', 'Assets register with equipment, status and holder', 'The equipment register: tag, item, status and who holds it.'),
  documents: shot('documents.jpg', 'Documents page with policies to sign and letters', 'Policies to read and sign, and letters you can request.'),
  offboarding: shot('offboarding.jpg', 'Offboarding with exits and their checklist progress', 'Each exit with its checklist progress and last working day.'),
  reports: shot('reports.jpg', 'People reports with headline figures and a joiners and leavers chart', 'Headline numbers and trends; small groups are combined to protect privacy.'),
  performance: shot('performance.jpg', 'Performance page with goals and progress', 'Goals with progress, and review cycles.'),
  'one-on-ones': shot('one-on-ones.jpg', '1:1 page with meeting list, shared agenda, action items and private notes', 'Upcoming and past 1:1s on the left; agenda, actions and notes on the right.'),
  learning: shot('learning.jpg', 'Learning page with course stats and My learning list', 'Your courses with due dates; the catalogue and compliance are in tabs.'),
  rewards: shot('rewards.jpg', 'Rewards catalogue with points, rewards and top earners', 'Your points, the reward catalogue and this month’s top earners.'),
  apps: shot('apps.jpg', 'Apps page with tasks to set up and remove app accounts', 'Requests, setup tasks for joiners and removal tasks for leavers.'),
  surveys: shot('surveys.jpg', 'Surveys page with open pulse surveys', 'Open surveys to answer, and results once enough people reply.'),
};
