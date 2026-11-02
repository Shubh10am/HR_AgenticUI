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
  { method: 'POST', pattern: /^\/api\/community\/posts$/, action: 'Published a community post', category: 'Community' },
  { method: 'POST', pattern: /^\/api\/community\/posts\/[^/]+\/like$/, action: 'Liked a post', category: 'Community' },
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
