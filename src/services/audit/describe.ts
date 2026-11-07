/**
 * Turns an API request into a readable action. Rules are checked in order and
 * the first match wins; anything unmatched falls back to "<verb> <area>".
 */
interface ActionRule {
  method: string;
  pattern: RegExp;
  action: string;
  category: string;
}

const RULES: ActionRule[] = [
  { method: 'PUT', pattern: /^\/api\/admin\/settings$/, action: 'Updated system settings', category: 'Admin' },
  { method: 'PUT', pattern: /^\/api\/admin\/email-templates$/, action: 'Edited an email template', category: 'Admin' },
  { method: 'POST', pattern: /^\/api\/admin\/plans$/, action: 'Created a subscription plan', category: 'Admin' },
  { method: 'PUT', pattern: /^\/api\/admin\/plans\/[^/]+$/, action: 'Updated a subscription plan', category: 'Admin' },
  { method: 'DELETE', pattern: /^\/api\/admin\/plans\/[^/]+$/, action: 'Deleted a subscription plan', category: 'Admin' },
  { method: 'POST', pattern: /^\/api\/auth\/login$/, action: 'Signed in', category: 'Authentication' },
  { method: 'POST', pattern: /^\/api\/auth\/change-password$/, action: 'Changed password', category: 'Authentication' },
  { method: 'POST', pattern: /^\/api\/employees\/bulk-delete$/, action: 'Deleted employees in bulk', category: 'Employees' },
  { method: 'POST', pattern: /^\/api\/employees\/bulk$/, action: 'Imported employees', category: 'Employees' },
  { method: 'POST', pattern: /^\/api\/employees$/, action: 'Added an employee', category: 'Employees' },
  { method: 'PUT', pattern: /^\/api\/employees\/[^/]+$/, action: 'Updated an employee', category: 'Employees' },
  { method: 'DELETE', pattern: /^\/api\/employees\/[^/]+$/, action: 'Deleted an employee', category: 'Employees' },
  { method: 'PATCH', pattern: /^\/api\/hierarchy\/[^/]+$/, action: 'Changed a reporting line', category: 'Employees' },
  { method: 'POST', pattern: /^\/api\/attendance\/clock-in$/, action: 'Clocked in', category: 'Attendance' },
  { method: 'POST', pattern: /^\/api\/attendance\/clock-out$/, action: 'Clocked out', category: 'Attendance' },
  { method: 'PUT', pattern: /^\/api\/attendance\/adjust$/, action: 'Corrected attendance', category: 'Attendance' },
  { method: 'POST', pattern: /^\/api\/leave-requests/, action: 'Submitted a leave request', category: 'Leave' },
  { method: 'PUT', pattern: /^\/api\/leave-requests/, action: 'Reviewed a leave request', category: 'Leave' },
  { method: 'PUT', pattern: /^\/api\/settings\/ai-provider$/, action: 'Changed the AI provider', category: 'Settings' },
  { method: 'POST', pattern: /^\/api\/settings\/ai-provider$/, action: 'Tested an AI provider', category: 'Settings' },
  { method: 'DELETE', pattern: /^\/api\/settings\/ai-provider$/, action: 'Reset the AI provider to the platform default', category: 'Settings' },
  { method: 'POST', pattern: /^\/api\/settings\/policy$/, action: 'Updated company policy', category: 'Settings' },
  { method: 'PUT', pattern: /^\/api\/settings\/policy$/, action: 'Updated company policy', category: 'Settings' },
  { method: 'PUT', pattern: /^\/api\/profile$/, action: 'Updated profile', category: 'Account' },
  { method: 'PUT', pattern: /^\/api\/profile\/preferences$/, action: 'Updated preferences', category: 'Account' },
  { method: 'DELETE', pattern: /^\/api\/profile\/delete-account$/, action: 'Deleted account', category: 'Account' },
  { method: 'POST', pattern: /^\/api\/profile\/delete-account$/, action: 'Deleted account', category: 'Account' },
  { method: 'POST', pattern: /^\/api\/google\/emails\/send$/, action: 'Sent an email', category: 'Email' },
  { method: 'POST', pattern: /^\/api\/google-auth\/disconnect$/, action: 'Disconnected Google', category: 'Integrations' },
  { method: 'POST', pattern: /^\/api\/knowledge$/, action: 'Added to the knowledge base', category: 'Knowledge Base' },
  { method: 'PATCH', pattern: /^\/api\/knowledge\/[^/]+$/, action: 'Renamed a knowledge base item', category: 'Knowledge Base' },
  { method: 'DELETE', pattern: /^\/api\/knowledge\/[^/]+$/, action: 'Deleted a knowledge base item', category: 'Knowledge Base' },
  { method: 'POST', pattern: /^\/api\/support\/tickets/, action: 'Opened a support ticket', category: 'Support' },
  { method: 'POST', pattern: /^\/api\/approvals\/[^/]+$/, action: 'Decided an approval', category: 'Approvals' },
  { method: 'PUT', pattern: /^\/api\/approvals\/policies$/, action: 'Changed approval rules', category: 'Approvals' },
  { method: 'POST', pattern: /^\/api\/expenses$/, action: 'Submitted an expense claim', category: 'Expenses' },
  { method: 'PATCH', pattern: /^\/api\/expenses$/, action: 'Marked claims as paid', category: 'Expenses' },
  { method: 'DELETE', pattern: /^\/api\/expenses\/[^/]+$/, action: 'Withdrew an expense claim', category: 'Expenses' },
  { method: 'POST', pattern: /^\/api\/offboarding$/, action: 'Started an exit', category: 'Offboarding' },
  { method: 'PATCH', pattern: /^\/api\/offboarding\/[^/]+$/, action: 'Updated an exit checklist', category: 'Offboarding' },
  { method: 'DELETE', pattern: /^\/api\/offboarding\/[^/]+$/, action: 'Withdrew an exit', category: 'Offboarding' },
  { method: 'POST', pattern: /^\/api\/offboarding\/[^/]+\/exit-interview$/, action: 'Shared exit feedback', category: 'Offboarding' },
  { method: 'POST', pattern: /^\/api\/performance\/goals$/, action: 'Created a goal', category: 'Performance' },
  { method: 'PATCH', pattern: /^\/api\/performance\/goals\/[^/]+$/, action: 'Updated a goal', category: 'Performance' },
  { method: 'DELETE', pattern: /^\/api\/performance\/goals\/[^/]+$/, action: 'Deleted a goal', category: 'Performance' },
  { method: 'POST', pattern: /^\/api\/performance\/cycles$/, action: 'Created a review cycle', category: 'Performance' },
  { method: 'PATCH', pattern: /^\/api\/performance\/cycles\/[^/]+$/, action: 'Launched or closed a review cycle', category: 'Performance' },
  { method: 'PUT', pattern: /^\/api\/performance\/reviews\/[^/]+$/, action: 'Saved a review', category: 'Performance' },
  { method: 'POST', pattern: /^\/api\/surveys$/, action: 'Created a survey', category: 'Surveys' },
  { method: 'PATCH', pattern: /^\/api\/surveys\/[^/]+$/, action: 'Opened or closed a survey', category: 'Surveys' },
  { method: 'POST', pattern: /^\/api\/surveys\/[^/]+\/respond$/, action: 'Answered a survey', category: 'Surveys' },
  { method: 'POST', pattern: /^\/api\/assets$/, action: 'Added equipment', category: 'Assets' },
  { method: 'PATCH', pattern: /^\/api\/assets\/[^/]+$/, action: 'Moved equipment', category: 'Assets' },
  { method: 'POST', pattern: /^\/api\/documents\/policies$/, action: 'Published a policy', category: 'Documents' },
  { method: 'PUT', pattern: /^\/api\/documents\/policies\/[^/]+$/, action: 'Edited a policy', category: 'Documents' },
  { method: 'POST', pattern: /^\/api\/documents\/policies\/[^/]+$/, action: 'Signed a policy', category: 'Documents' },
  { method: 'POST', pattern: /^\/api\/documents\/letters$/, action: 'Requested or issued a letter', category: 'Documents' },
  { method: 'PATCH', pattern: /^\/api\/documents\/letters\/[^/]+$/, action: 'Issued or declined a letter', category: 'Documents' },
  { method: 'POST', pattern: /^\/api\/leave$/, action: 'Requested leave', category: 'Leave' },
  { method: 'DELETE', pattern: /^\/api\/leave\/[^/]+$/, action: 'Withdrew leave', category: 'Leave' },
  { method: 'PUT', pattern: /^\/api\/leave\/policy$/, action: 'Changed leave policy', category: 'Leave' },
  { method: 'POST', pattern: /^\/api\/leave\/holidays$/, action: 'Added a holiday', category: 'Leave' },
  { method: 'DELETE', pattern: /^\/api\/leave\/holidays/, action: 'Removed a holiday', category: 'Leave' },
  { method: 'POST', pattern: /^\/api\/shifts$/, action: 'Created a shift', category: 'Shifts' },
  { method: 'PUT', pattern: /^\/api\/shifts\/[^/]+$/, action: 'Edited a shift', category: 'Shifts' },
  { method: 'POST', pattern: /^\/api\/shifts\/assign$/, action: 'Assigned shifts', category: 'Shifts' },
  { method: 'PUT', pattern: /^\/api\/timesheets$/, action: 'Saved a timesheet', category: 'Timesheets' },
  { method: 'POST', pattern: /^\/api\/timesheets$/, action: 'Submitted or withdrew a timesheet', category: 'Timesheets' },
  { method: 'POST', pattern: /^\/api\/timesheets\/projects$/, action: 'Saved a project', category: 'Timesheets' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/read$/, action: 'Read an announcement', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/rewards$/, action: 'Redeemed a reward', category: 'Rewards' },
  { method: 'POST', pattern: /^\/api\/rewards\/items$/, action: 'Saved a reward', category: 'Rewards' },
  { method: 'POST', pattern: /^\/api\/rewards\/award$/, action: 'Awarded points', category: 'Rewards' },
  { method: 'PATCH', pattern: /^\/api\/rewards\/redemptions$/, action: 'Handled a reward request', category: 'Rewards' },
  { method: 'POST', pattern: /^\/api\/learning$/, action: 'Joined a course', category: 'Learning' },
  { method: 'POST', pattern: /^\/api\/learning\/courses$/, action: 'Saved a course', category: 'Learning' },
  { method: 'POST', pattern: /^\/api\/learning\/assign$/, action: 'Assigned a course', category: 'Learning' },
  { method: 'PATCH', pattern: /^\/api\/learning\/[^/]+$/, action: 'Updated course progress', category: 'Learning' },
  { method: 'POST', pattern: /^\/api\/one-on-ones$/, action: 'Booked a 1:1', category: '1:1s' },
  { method: 'PATCH', pattern: /^\/api\/one-on-ones\/[^/]+$/, action: 'Updated a 1:1', category: '1:1s' },
  { method: 'PUT', pattern: /^\/api\/payroll\/structures$/, action: 'Changed someone’s pay', category: 'Payroll' },
  { method: 'POST', pattern: /^\/api\/payroll\/runs$/, action: 'Prepared a pay run', category: 'Payroll' },
  { method: 'POST', pattern: /^\/api\/payroll\/runs\/[^/]+$/, action: 'Published payslips', category: 'Payroll' },
  { method: 'DELETE', pattern: /^\/api\/payroll\/runs\/[^/]+$/, action: 'Deleted a draft pay run', category: 'Payroll' },
  { method: 'POST', pattern: /^\/api\/apps$/, action: 'Requested app access', category: 'Apps' },
  { method: 'PUT', pattern: /^\/api\/apps$/, action: 'Saved an app', category: 'Apps' },
  { method: 'DELETE', pattern: /^\/api\/apps\/[^/]+$/, action: 'Withdrew or gave up app access', category: 'Apps' },
  { method: 'PATCH', pattern: /^\/api\/apps\/[^/]+$/, action: 'Completed an app access task', category: 'Apps' },
  { method: 'POST', pattern: /^\/api\/apps\/people$/, action: 'Set up or removed someone’s apps', category: 'Apps' },
  { method: 'POST', pattern: /^\/api\/community\/posts$/, action: 'Published a community post', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/like$/, action: 'Liked a post', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/react$/, action: 'Reacted to a post', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/vote$/, action: 'Voted in a poll', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/rsvp$/, action: 'Responded to an event', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/save$/, action: 'Saved a post', category: 'Community' },
  { method: 'PATCH', pattern: /^\/api\/community\/posts\/[^/]+$/, action: 'Pinned or unpinned a post', category: 'Community' },
  { method: 'PUT', pattern: /^\/api\/community\/posts\/[^/]+\/comment\/[^/]+$/, action: 'Edited a comment', category: 'Community' },
  { method: 'PUT', pattern: /^\/api\/community\/birthday$/, action: 'Updated birthday sharing', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/comment$/, action: 'Commented on a post', category: 'Community' },
  { method: 'DELETE', pattern: /^\/api\/community\/posts/, action: 'Deleted community content', category: 'Community' },
];

const VERBS: Record<string, string> = { POST: 'Created', PUT: 'Updated', PATCH: 'Updated', DELETE: 'Deleted' };

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Describes a request as `{ action, category }` for the audit log. */
export function describeAction(method: string, path: string): { action: string; category: string } {
  const rule = RULES.find((candidate) => candidate.method === method && candidate.pattern.test(path));
  if (rule) return { action: rule.action, category: rule.category };
  const area = titleCase(path.replace(/^\/api\//, '').split('/')[0] || 'app');
  return { action: `${VERBS[method] ?? method} in ${area}`, category: area };
}
