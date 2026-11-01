// Sample data shown in guest mode so visitors can see how each feature works.
// Everything here is fictional: made-up people at example.com and documentation-range IPs.
import type { CommItem, CommSourceStatus } from '@/lib/communications';
import type { ProfileOverview } from '@/services/profile/overview';

export const GUEST_ORG_ID = 'guest-org-id';

/** True for the guest session (or no session), which has no server account. */
export const isGuestToken = (token: string | null | undefined) => !token || token.startsWith('guest-');

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const CHROME_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const SAFARI_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const EDGE_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0';

export interface DemoAuditEntry {
  _id: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: string;
  method: string;
  path: string;
  statusCode: number;
  outcome: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

const PEOPLE = {
  guest: ['Guest User', 'guest@hrstreamline.ai', 'Employee', '203.0.113.24', CHROME_MAC],
  maya: ['Maya Fernandes', 'maya.fernandes@example.com', 'Admin', '198.51.100.17', EDGE_WIN],
  leo: ['Leo Hartmann', 'leo.hartmann@example.com', 'HR', '203.0.113.88', CHROME_MAC],
  sana: ['Sana Qureshi', 'sana.qureshi@example.com', 'Manager', '198.51.100.42', SAFARI_IOS],
  omar: ['Omar Velasco', 'omar.velasco@example.com', 'Employee', '192.0.2.61', FIREFOX_LINUX],
} as const;

// [who, action, category, method, path, status, minutes ago, ua override?]
const AUDIT_ROWS: [keyof typeof PEOPLE, string, string, string, string, number, number, string?][] = [
  ['guest', 'Signed in', 'Authentication', 'POST', '/api/auth/login', 200, 3],
  ['guest', 'Updated preferences', 'Account', 'PUT', '/api/profile/preferences', 200, 9],
  ['maya', 'Added an employee', 'Employees', 'POST', '/api/employees', 201, 26],
  ['leo', 'Reviewed a leave request', 'Leave', 'PUT', '/api/leave-requests/lr-204', 200, 48],
  ['sana', 'Clocked in', 'Attendance', 'POST', '/api/attendance/clock-in', 200, 95],
  ['omar', 'Signed in', 'Authentication', 'POST', '/api/auth/login', 401, 130],
  ['omar', 'Signed in', 'Authentication', 'POST', '/api/auth/login', 200, 128],
  ['guest', 'Sent an email', 'Email', 'POST', '/api/google/emails/send', 200, 4 * 60],
  ['maya', 'Changed the AI provider', 'Settings', 'PUT', '/api/settings/ai-provider', 200, 6 * 60],
  ['leo', 'Added to the knowledge base', 'Knowledge Base', 'POST', '/api/knowledge', 201, 9 * 60],
  ['guest', 'Submitted a leave request', 'Leave', 'POST', '/api/leave-requests', 201, 22 * 60],
  ['sana', 'Clocked out', 'Attendance', 'POST', '/api/attendance/clock-out', 200, 26 * 60],
  ['maya', 'Imported employees', 'Employees', 'POST', '/api/employees/bulk', 201, 28 * 60],
  ['guest', 'Signed in', 'Authentication', 'POST', '/api/auth/login', 200, 30 * 60, SAFARI_IOS],
  ['leo', 'Updated an employee', 'Employees', 'PUT', '/api/employees/emp-118', 200, 2 * 24 * 60],
  ['omar', 'Changed password', 'Authentication', 'POST', '/api/auth/change-password', 200, 2 * 24 * 60 + 40],
  ['maya', 'Deleted an employee', 'Employees', 'DELETE', '/api/employees/emp-097', 403, 3 * 24 * 60],
  ['guest', 'Updated profile', 'Account', 'PUT', '/api/profile', 200, 4 * 24 * 60],
  ['sana', 'Reviewed a leave request', 'Leave', 'PUT', '/api/leave-requests/lr-198', 200, 5 * 24 * 60],
  ['leo', 'Updated company policy', 'Settings', 'PUT', '/api/settings/policy', 200, 6 * 24 * 60],
  ['guest', 'Clocked in', 'Attendance', 'POST', '/api/attendance/clock-in', 200, 7 * 24 * 60],
  ['maya', 'Disconnected Google', 'Integrations', 'POST', '/api/google-auth/disconnect', 200, 8 * 24 * 60],
];

/** A fresh sample audit log, timed relative to now. */
export function demoAuditEntries(): DemoAuditEntry[] {
  return AUDIT_ROWS.map(([who, action, category, method, path, statusCode, minutes, ua], index) => {
    const [actorName, actorEmail, actorRole, ipAddress, userAgent] = PEOPLE[who];
    return {
      _id: `demo-audit-${index}`,
      actorName, actorEmail, actorRole, action, category, method, path, statusCode,
      outcome: statusCode < 400 ? 'success' : 'failure',
      ipAddress, userAgent: ua ?? userAgent,
      createdAt: ago(minutes * MIN),
    };
  });
}

/** The sample log filtered and paged the way the real API does it. */
export function demoAuditPage(params: URLSearchParams) {
  const q = (params.get('q') ?? '').toLowerCase();
  const from = params.get('from') ? new Date(params.get('from')!).getTime() : -Infinity;
  const to = params.get('to') ? new Date(params.get('to')!).getTime() : Infinity;
  const all = demoAuditEntries();
  const entries = all.filter((e) =>
    (!q || `${e.actorName} ${e.actorEmail} ${e.action} ${e.ipAddress}`.toLowerCase().includes(q)) &&
    (!params.get('category') || e.category === params.get('category')) &&
    (!params.get('outcome') || e.outcome === params.get('outcome')) &&
    new Date(e.createdAt).getTime() >= from && new Date(e.createdAt).getTime() <= to
  );
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 25);
  return {
    entries: entries.slice((page - 1) * limit, page * limit),
    total: entries.length,
    page,
    limit,
    categories: Array.from(new Set(all.map((e) => e.category))).sort(),
    scope: 'organization' as const,
    retentionDays: 365,
  };
}

/** The guest's own sample history for the Profile page. */
export function demoProfileOverview(): ProfileOverview {
  const mine = demoAuditEntries().filter((e) => e.actorEmail === PEOPLE.guest[1]);
  const signIns = mine.filter((e) => e.action === 'Signed in');
  return {
    joinedAt: ago(120 * DAY),
    lastSignIn: { at: signIns[1].createdAt, ipAddress: signIns[1].ipAddress, userAgent: signIns[1].userAgent },
    recent: mine.map((e) => ({
      id: e._id, action: e.action, category: e.category, outcome: e.outcome,
      ipAddress: e.ipAddress, userAgent: e.userAgent, createdAt: e.createdAt,
      isNewDevice: e.userAgent === SAFARI_IOS,
    })),
    stats: {
      windowDays: 30,
      actions: mine.length,
      signIns: signIns.length,
      failedSignIns: 0,
      devices: new Set(mine.map((e) => e.userAgent)).size,
      byCategory: [],
    },
  };
}

/** A sample Unified Communications feed across every source. */
export function demoCommunications(): { items: CommItem[]; sources: CommSourceStatus[] } {
  const items: CommItem[] = [
    { id: 'd1', source: 'calendar', platform: 'Google Meet', counterpart: 'You + 4 guests', summary: 'Weekly HR sync', type: 'Upcoming meeting', at: new Date(Date.now() + 2 * HOUR).toISOString(), link: null },
    { id: 'd2', source: 'gmail', platform: 'Email', counterpart: 'Leo Hartmann', summary: 'Updated leave policy for review', type: 'Received · unread', at: ago(18 * MIN), link: '/gmail-inbox' },
    { id: 'd3', source: 'community', platform: 'Community', counterpart: 'Maya Fernandes', summary: 'Office closed on Friday for maintenance', type: 'Post · Announcements', at: ago(55 * MIN), link: '/community' },
    { id: 'd4', source: 'gmail', platform: 'Email', counterpart: 'Sana Qureshi', summary: 'RE: Interview panel for the backend role', type: 'Sent', at: ago(2 * HOUR), link: '/gmail-inbox' },
    { id: 'd5', source: 'calendar', platform: 'Zoom', counterpart: 'Omar Velasco', summary: 'Candidate interview: Product Designer', type: 'Meeting', at: ago(5 * HOUR), link: null },
    { id: 'd6', source: 'community', platform: 'Community', counterpart: 'Omar Velasco', summary: 'On “Office closed on Friday for maintenance”', type: 'Comment', at: ago(6 * HOUR), link: '/community' },
    { id: 'd7', source: 'gmail', platform: 'Email', counterpart: 'Payroll Team', summary: 'October payslips are ready', type: 'Received', at: ago(DAY), link: '/gmail-inbox' },
    { id: 'd8', source: 'calendar', platform: 'Microsoft Teams', counterpart: 'Vendor: BenefitsCo', summary: 'Health insurance renewal call', type: 'Meeting', at: ago(DAY + 3 * HOUR), link: null },
    { id: 'd9', source: 'calendar', platform: 'Calendar', counterpart: 'Just you', summary: 'Prepare onboarding packs', type: 'Meeting', at: ago(2 * DAY), link: null },
    { id: 'd10', source: 'gmail', platform: 'Email', counterpart: 'Maya Fernandes', summary: 'Welcome the three new joiners', type: 'Received', at: ago(3 * DAY), link: '/gmail-inbox' },
  ];
  const count = (source: CommItem['source']) => items.filter((i) => i.source === source).length;
  return {
    items,
    sources: [
      { id: 'gmail', label: 'Gmail', state: 'connected', count: count('gmail') },
      { id: 'calendar', label: 'Google Calendar', state: 'connected', count: count('calendar') },
      { id: 'community', label: 'Community', state: 'connected', count: count('community') },
    ],
  };
}

/** Today's sample attendance board: who has clocked in and who is away. */
export function demoAttendanceBoard() {
  const today = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
  return {
    presentEmployees: [
      { _id: 'demo-p1', name: 'Maya Fernandes', department: 'Operations', clockInTime: today(8, 52) },
      { _id: 'demo-p2', name: 'Leo Hartmann', department: 'Human Resources', clockInTime: today(9, 4) },
      { _id: 'demo-p3', name: 'Sana Qureshi', department: 'Engineering', clockInTime: today(9, 11) },
      { _id: 'demo-p4', name: 'Priyanka Rao', department: 'Engineering', clockInTime: today(9, 27) },
      { _id: 'demo-p5', name: 'Daniel Okafor', department: 'Sales', clockInTime: today(9, 45) },
    ],
    absentEmployees: [
      { _id: 'demo-a1', name: 'Omar Velasco', department: 'Engineering', leaveType: 'Sick Leave' },
      { _id: 'demo-a2', name: 'Elena Novak', department: 'Marketing', leaveType: 'Annual Leave' },
      { _id: 'demo-a3', name: 'Kenji Watanabe', department: 'Finance' },
    ],
  };
}

const emailBody = (paragraphs: string[]) => paragraphs.map((p) => `<p>${p}</p>`).join('');

const DEMO_EMAILS = [
  { id: 'demo-mail-1', mailbox: 'inbox', category: 'primary', from: 'Leo Hartmann <leo.hartmann@example.com>', subject: 'Updated leave policy for review', minutes: 18,
    body: ['Hi,', 'I have attached the updated leave policy. The main change is that unused annual leave can now be carried over for up to three months.', 'Could you review it by Thursday so we can share it with everyone on Friday?', 'Thanks,<br>Leo'] },
  { id: 'demo-mail-2', mailbox: 'inbox', category: 'primary', from: 'Omar Velasco <omar.velasco@example.com>', subject: 'Request: work from home next week', minutes: 70,
    body: ['Hello,', 'I would like to work from home from Monday to Wednesday next week while my flat is being repaired. I will be online during core hours and available for all meetings.', 'Please let me know if that is okay.', 'Best,<br>Omar'] },
  { id: 'demo-mail-3', mailbox: 'inbox', category: 'updates', from: 'Payroll Team <payroll@example.com>', subject: 'October payslips are ready', minutes: 24 * 60,
    body: ['Your October payslip is now available in the Payroll section.', 'If anything looks wrong, reply to this email before the 10th.'] },
  { id: 'demo-mail-4', mailbox: 'inbox', category: 'primary', from: 'Maya Fernandes <maya.fernandes@example.com>', subject: 'Welcome the three new joiners', minutes: 3 * 24 * 60,
    body: ['Team,', 'Three new colleagues join us on Monday: two in Engineering and one in Sales. Please make them feel welcome and help them settle in.', 'Their onboarding plans are in the Onboarding section.', 'Maya'] },
  { id: 'demo-mail-5', mailbox: 'inbox', category: 'promotions', from: 'BenefitsCo <offers@example.com>', subject: 'Your team wellness plan renewal', minutes: 4 * 24 * 60,
    body: ['Your wellness plan renews next month. Book a call to review options for your team.'] },
  { id: 'demo-mail-6', mailbox: 'sent', category: 'primary', from: 'Guest User <guest@hrstreamline.ai>', to: 'Sana Qureshi <sana.qureshi@example.com>', subject: 'RE: Interview panel for the backend role', minutes: 120,
    body: ['Hi Sana,', 'Thanks for putting the panel together. Tuesday at 2 pm works for me.', 'Best regards'] },
] as const;

/** Sample emails for the Gmail Inbox page, filtered like the real mailbox. */
export function demoEmails(mailbox: string, category: string) {
  return DEMO_EMAILS
    .filter((e) => e.mailbox === mailbox && (category === 'all' || e.category === category))
    .map((e) => ({
      id: e.id,
      threadId: e.id,
      from: e.from,
      to: 'to' in e ? e.to : 'Guest User <guest@hrstreamline.ai>',
      subject: e.subject,
      snippet: (e.body[1] ?? e.body[0]).replace(/<[^>]+>/g, ' ').slice(0, 120),
      body: emailBody([...e.body]),
      date: new Date(Date.now() - e.minutes * MIN).toUTCString(),
      category: e.category,
    }));
}

/** Sample upcoming calendar events. */
export function demoCalendarEvents() {
  const at = (days: number, hour: number, minutes = 0) => { const d = new Date(Date.now() + days * DAY); d.setHours(hour, minutes, 0, 0); return d.toISOString(); };
  return [
    { id: 'demo-ev-1', summary: 'Weekly HR sync', start: { dateTime: at(0, 15) }, end: { dateTime: at(0, 15, 30) } },
    { id: 'demo-ev-2', summary: 'Interview: Product Designer', start: { dateTime: at(1, 11) }, end: { dateTime: at(1, 12) } },
    { id: 'demo-ev-3', summary: 'New joiner orientation', start: { dateTime: at(3, 10) }, end: { dateTime: at(3, 11, 30) } },
    { id: 'demo-ev-4', summary: 'Company holiday', start: { date: at(5, 0).slice(0, 10) }, end: { date: at(6, 0).slice(0, 10) } },
  ];
}

const KB = [
  { _id: 'demo-kb-policies', parentId: null, type: 'folder', name: 'HR Policies', days: 40 },
  { _id: 'demo-kb-onboarding', parentId: null, type: 'folder', name: 'Onboarding', days: 25 },
  { _id: 'demo-kb-handbook', parentId: null, type: 'document', name: 'Employee Handbook 2026.pdf', mimeType: 'application/pdf', sizeBytes: 1_840_000, chunks: 64, days: 12 },
  { _id: 'demo-kb-holidays', parentId: null, type: 'document', name: 'Public holidays 2026.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 48_000, chunks: 3, days: 30 },
  { _id: 'demo-kb-leave', parentId: 'demo-kb-policies', type: 'document', name: 'Leave policy.pdf', mimeType: 'application/pdf', sizeBytes: 320_000, chunks: 14, days: 2 },
  { _id: 'demo-kb-remote', parentId: 'demo-kb-policies', type: 'document', name: 'Remote work guidelines.md', mimeType: 'text/markdown', sizeBytes: 9_200, chunks: 5, days: 20 },
  { _id: 'demo-kb-expenses', parentId: 'demo-kb-policies', type: 'document', name: 'Travel and expenses.pdf', mimeType: 'application/pdf', sizeBytes: 410_000, chunks: 18, days: 35 },
  { _id: 'demo-kb-firstweek', parentId: 'demo-kb-onboarding', type: 'document', name: 'Your first week.pdf', mimeType: 'application/pdf', sizeBytes: 210_000, chunks: 9, days: 25 },
  { _id: 'demo-kb-it', parentId: 'demo-kb-onboarding', type: 'document', name: 'IT setup checklist.txt', mimeType: 'text/plain', sizeBytes: 3_100, chunks: 2, days: 25 },
] as const;

/** A sample knowledge base with folders and indexed documents. */
export function demoKnowledge(parentId: string | null, search?: string) {
  const q = (search ?? '').trim().toLowerCase();
  const items = KB
    .filter((item) => (q ? item.name.toLowerCase().includes(q) : item.parentId === parentId))
    .map((item) => ({
      _id: item._id,
      parentId: item.parentId,
      type: item.type,
      name: item.name,
      mimeType: 'mimeType' in item ? item.mimeType : undefined,
      sizeBytes: 'sizeBytes' in item ? item.sizeBytes : undefined,
      status: 'ready' as const,
      chunkCount: 'chunks' in item ? item.chunks : 0,
      ownerName: 'Leo Hartmann',
      createdAt: ago(item.days * DAY),
      updatedAt: ago(item.days * DAY),
    }));
  const parent = KB.find((item) => item._id === parentId);
  return { items, breadcrumbs: parent ? [{ id: parent._id, name: parent.name }] : [] };
}

const KB_ANSWERS: { match: RegExp; answer: string; source: [string, string]; text: string }[] = [
  { match: /leave|holiday|vacation|annual/i, answer: 'Full-time employees get 24 days of paid annual leave a year, plus public holidays. Up to 5 unused days can be carried over for three months.',
    source: ['demo-kb-leave', 'Leave policy.pdf'], text: 'Each full-time employee is entitled to 24 days of paid annual leave per calendar year… up to five unused days may be carried over and must be used within three months.' },
  { match: /hour|time|shift|core/i, answer: 'Standard hours are 9:30 am to 6:00 pm, Monday to Friday. Core hours, when everyone should be reachable, are 11:00 am to 4:00 pm.',
    source: ['demo-kb-handbook', 'Employee Handbook 2026.pdf'], text: 'Our standard working day runs from 9:30 to 18:00… core collaboration hours are 11:00 to 16:00.' },
  { match: /dress|wear|attire/i, answer: 'Business casual in the office. Smart formal for client meetings and events.',
    source: ['demo-kb-handbook', 'Employee Handbook 2026.pdf'], text: 'The everyday dress code is business casual. When meeting clients, please dress smart formal.' },
  { match: /remote|home|wfh/i, answer: 'You can work from home up to two days a week with your manager’s agreement, as long as you are online during core hours.',
    source: ['demo-kb-remote', 'Remote work guidelines.md'], text: 'Employees may work remotely up to two days per week, agreed with their manager…' },
  { match: /notice|resign/i, answer: 'The notice period is 30 days during probation and 60 days after confirmation.',
    source: ['demo-kb-handbook', 'Employee Handbook 2026.pdf'], text: 'Notice period: 30 days during probation, 60 days thereafter.' },
];

/** A canned answer from the sample documents, so guests can see how "Ask" works. */
export function demoKnowledgeAnswer(question: string) {
  const hit = KB_ANSWERS.find((entry) => entry.match.test(question));
  if (!hit) return { passages: [], answer: 'The sample documents don’t cover that. Try asking about leave, working hours, remote work, notice period or the dress code.', isAnswered: false };
  return { passages: [{ sourceId: hit.source[0], sourceName: hit.source[1], text: hit.text, score: 0.92 }], answer: hit.answer, isAnswered: true };
}
