// The integrations catalogue. Only Google products connect today (one Google sign-in covers
// all four); everything else is on the roadmap and can be requested.

export type IntegrationCategory =
  | 'Email & Calendar' | 'Communication' | 'HRIS' | 'Payroll & Finance' | 'Recruiting'
  | 'Background Checks' | 'Performance & Engagement' | 'Identity & Security' | 'Documents & eSignature'
  | 'Project Management' | 'Learning' | 'Automation' | 'Development';

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  features: string[];
  /** A hosted logo (must be allowed in next.config), else a coloured initial tile is shown. */
  logoUrl?: string;
  /** Simple Icons slug (simpleicons.org); its brand logo is used when no logoUrl is set. */
  iconSlug?: string;
  /** Brand colour for the initial tile. */
  color: string;
  /** 'google' connects through the app's Google sign-in; 'roadmap' can be requested. */
  availability: 'google' | 'roadmap';
  popular?: boolean;
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  // Live: Google
  { id: 'gmail', name: 'Gmail', category: 'Email & Calendar', availability: 'google', popular: true, color: '#EA4335',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
    description: 'Read, search and reply to email with AI drafts, right inside the Gmail Inbox page.', features: ['Inbox & sent mail', 'AI reply drafts', 'Send replies'] },
  { id: 'google-calendar', name: 'Google Calendar', category: 'Email & Calendar', availability: 'google', popular: true, color: '#4285F4',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/250px-Google_Calendar_icon_%282020%29.svg.png',
    description: 'See upcoming events and meetings next to your inbox and in the Communications hub.', features: ['Upcoming events', 'Meeting history', 'Communications feed'] },
  { id: 'google-meet', name: 'Google Meet', category: 'Communication', availability: 'google', color: '#00AC47',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg',
    description: 'Meet calls from your calendar show up in the Communications hub.', features: ['Meeting log', 'Join links', 'Attendance from calendar'] },
  { id: 'google-workspace', name: 'Google Workspace', category: 'Documents & eSignature', availability: 'google', color: '#4285F4',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
    description: 'One Google sign-in connects Gmail, Calendar and Meet for your account.', features: ['Single sign-in', 'Shared permissions', 'Disconnect anytime'] },

  // Communication
  { id: 'slack', iconSlug: 'slack', name: 'Slack', category: 'Communication', availability: 'roadmap', popular: true, color: '#4A154B',
    logoUrl: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
    description: 'Post approvals, leave requests and announcements to channels and act on them in Slack.', features: ['Approval notifications', 'Slash commands', 'Channel announcements'] },
  { id: 'microsoft-teams', iconSlug: 'microsoftteams', name: 'Microsoft Teams', category: 'Communication', availability: 'roadmap', popular: true, color: '#5059C9',
    description: 'Send HR notifications and approvals to Teams chats and channels.', features: ['Adaptive card approvals', 'Channel posts', 'Copilot in Teams'] },
  { id: 'zoom', iconSlug: 'zoom', name: 'Zoom', category: 'Communication', availability: 'roadmap', color: '#0B5CFF',
    description: 'Create interview links automatically and log meetings in the Communications hub.', features: ['Auto interview links', 'Meeting log', 'Recording links'] },
  { id: 'outlook', iconSlug: 'microsoftoutlook', name: 'Microsoft Outlook', category: 'Email & Calendar', availability: 'roadmap', popular: true, color: '#0078D4',
    description: 'Outlook mail and calendar for Microsoft 365 organizations.', features: ['Mail & AI replies', 'Calendar sync', 'Interview scheduling'] },
  { id: 'calendly', iconSlug: 'calendly', name: 'Calendly', category: 'Email & Calendar', availability: 'roadmap', color: '#006BFF',
    description: 'Let candidates book interview slots from your recruiters’ availability.', features: ['Interview booking links', 'Reminders', 'Calendar sync'] },

  // HRIS
  { id: 'workday', iconSlug: 'workday', name: 'Workday', category: 'HRIS', availability: 'roadmap', popular: true, color: '#F38B00',
    description: 'Sync employee records, org structure and time off with Workday HCM.', features: ['Employee sync', 'Org chart sync', 'Time-off sync'] },
  { id: 'bamboohr', iconSlug: 'bamboohr', name: 'BambooHR', category: 'HRIS', availability: 'roadmap', popular: true, color: '#73C41D',
    description: 'Keep people data, departments and time off in step with BambooHR.', features: ['Employee directory', 'Time-off balances', 'Onboarding tasks'] },
  { id: 'sap-successfactors', iconSlug: 'sap', name: 'SAP SuccessFactors', category: 'HRIS', availability: 'roadmap', color: '#0FAAFF',
    description: 'Enterprise core HR, performance and learning data from SuccessFactors.', features: ['Employee Central sync', 'Org data', 'Performance data'] },
  { id: 'hibob', iconSlug: 'hibob', name: 'HiBob', category: 'HRIS', availability: 'roadmap', color: '#E8466C',
    description: 'Sync people data, time off and onboarding flows with Bob.', features: ['People data', 'Time off', 'Onboarding'] },
  { id: 'zoho-people', iconSlug: 'zoho', name: 'Zoho People', category: 'HRIS', availability: 'roadmap', color: '#E42527',
    description: 'Attendance, leave and employee records from Zoho People.', features: ['Attendance import', 'Leave sync', 'Employee records'] },
  { id: 'darwinbox', iconSlug: 'darwinbox', name: 'Darwinbox', category: 'HRIS', availability: 'roadmap', color: '#2F5BEA',
    description: 'Core HR, attendance and leave for large teams in India and Southeast Asia.', features: ['Core HR sync', 'Attendance', 'Leave policies'] },
  { id: 'keka', iconSlug: 'keka', name: 'Keka', category: 'HRIS', availability: 'roadmap', color: '#6C4CF1',
    description: 'Employee data, attendance and leave from Keka HR.', features: ['Employee sync', 'Attendance', 'Leave'] },

  // Payroll & Finance
  { id: 'adp', iconSlug: 'adp', name: 'ADP Workforce Now', category: 'Payroll & Finance', availability: 'roadmap', popular: true, color: '#D0271D',
    description: 'Send approved hours and changes to ADP payroll and pull payslip status back.', features: ['Payroll export', 'Payslip status', 'Tax forms'] },
  { id: 'gusto', iconSlug: 'gusto', name: 'Gusto', category: 'Payroll & Finance', availability: 'roadmap', color: '#F45D48',
    description: 'Payroll, benefits and contractor payments for small and mid-sized teams.', features: ['Payroll runs', 'Benefits', 'Contractor payments'] },
  { id: 'rippling', iconSlug: 'rippling', name: 'Rippling', category: 'Payroll & Finance', availability: 'roadmap', color: '#FDB515',
    description: 'Payroll, devices and app access managed from one employee record.', features: ['Payroll', 'Device management', 'App provisioning'] },
  { id: 'deel', iconSlug: 'deel', name: 'Deel', category: 'Payroll & Finance', availability: 'roadmap', popular: true, color: '#15357A',
    description: 'Hire and pay employees and contractors in other countries.', features: ['Global payroll', 'Contractor contracts', 'Compliance documents'] },
  { id: 'greythr', iconSlug: 'greythr', name: 'greytHR', category: 'Payroll & Finance', availability: 'roadmap', color: '#1E88E5',
    description: 'Payroll and statutory compliance for Indian businesses.', features: ['Payroll processing', 'PF / ESI / PT', 'Payslips'] },
  { id: 'quickbooks', iconSlug: 'quickbooks', name: 'QuickBooks', category: 'Payroll & Finance', availability: 'roadmap', color: '#2CA01C',
    description: 'Post payroll journals and expense claims to your accounts.', features: ['Payroll journals', 'Expense sync', 'Department costs'] },
  { id: 'xero', iconSlug: 'xero', name: 'Xero', category: 'Payroll & Finance', availability: 'roadmap', color: '#13B5EA',
    description: 'Payroll journals and reimbursements in Xero.', features: ['Payroll journals', 'Reimbursements', 'Tracking categories'] },

  // Recruiting
  { id: 'linkedin', iconSlug: 'linkedin', name: 'LinkedIn Recruiter', category: 'Recruiting', availability: 'roadmap', popular: true, color: '#0A66C2',
    description: 'Post jobs and bring applicants into the AI recruitment pipeline.', features: ['Job posting', 'Applicant import', 'InMail templates'] },
  { id: 'greenhouse', iconSlug: 'greenhouse', name: 'Greenhouse', category: 'Recruiting', availability: 'roadmap', popular: true, color: '#24A47F',
    description: 'Sync jobs, candidates and scorecards; hand hires straight into onboarding.', features: ['Candidate sync', 'Scorecards', 'Hire → onboarding'] },
  { id: 'lever', iconSlug: 'lever', name: 'Lever', category: 'Recruiting', availability: 'roadmap', color: '#2C3E50',
    description: 'Pipeline stages, feedback and offers from Lever.', features: ['Pipeline sync', 'Interview feedback', 'Offer status'] },
  { id: 'indeed', iconSlug: 'indeed', name: 'Indeed', category: 'Recruiting', availability: 'roadmap', color: '#2164F3',
    description: 'Publish openings to Indeed and screen applicants with AI.', features: ['Job posting', 'Applicant import', 'Screening questions'] },
  { id: 'naukri', iconSlug: 'naukri', name: 'Naukri', category: 'Recruiting', availability: 'roadmap', color: '#4A90E2',
    description: 'Post jobs and source candidates from India’s largest job board.', features: ['Job posting', 'Resume search', 'Applicant import'] },

  // Background checks
  { id: 'checkr', iconSlug: 'checkr', name: 'Checkr', category: 'Background Checks', availability: 'roadmap', color: '#0F6FFF',
    description: 'Order background checks for new hires, with candidate consent, and track the results.', features: ['Consent-based checks', 'Status tracking', 'Adverse action workflow'] },

  // Performance & engagement
  { id: 'lattice', iconSlug: 'lattice', name: 'Lattice', category: 'Performance & Engagement', availability: 'roadmap', color: '#2B2B2B',
    description: 'Reviews, goals and 1:1s alongside your people data.', features: ['Review cycles', 'Goals', '1:1 agendas'] },
  { id: 'culture-amp', iconSlug: 'cultureamp', name: 'Culture Amp', category: 'Performance & Engagement', availability: 'roadmap', color: '#F05A28',
    description: 'Engagement surveys and results by team.', features: ['Engagement surveys', 'Team insights', 'Action plans'] },
  { id: '15five', iconSlug: '15five', name: '15Five', category: 'Performance & Engagement', availability: 'roadmap', color: '#FF5D3B',
    description: 'Weekly check-ins, OKRs and manager coaching.', features: ['Weekly check-ins', 'OKRs', 'High fives'] },

  // Identity & security
  { id: 'okta', iconSlug: 'okta', name: 'Okta', category: 'Identity & Security', availability: 'roadmap', popular: true, color: '#007DC1',
    description: 'Single sign-on, and automatic account set-up and removal when people join or leave.', features: ['SSO (SAML / OIDC)', 'Provisioning (SCIM)', 'Deprovisioning on exit'] },
  { id: 'entra-id', iconSlug: 'microsoftazure', name: 'Microsoft Entra ID', category: 'Identity & Security', availability: 'roadmap', color: '#0078D4',
    description: 'Sign in with Microsoft and keep accounts in step with your directory.', features: ['SSO', 'Group sync', 'SCIM provisioning'] },

  // Documents & eSignature
  { id: 'docusign', iconSlug: 'docusign', name: 'DocuSign', category: 'Documents & eSignature', availability: 'roadmap', popular: true, color: '#4C00FF',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Docusign_Full_Color.svg/500px-Docusign_Full_Color.svg.png',
    description: 'Send offer letters and policies for eSignature and track who has signed.', features: ['Offer letters', 'Policy acknowledgements', 'Signature tracking'] },
  { id: 'notion', iconSlug: 'notion', name: 'Notion', category: 'Documents & eSignature', availability: 'roadmap', color: '#000000',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    description: 'Import handbook pages into the Knowledge Base so Copilot can answer from them.', features: ['Page import', 'Knowledge Base sync', 'Auto refresh'] },

  // Project management
  { id: 'jira', iconSlug: 'jira', name: 'Jira', category: 'Project Management', availability: 'roadmap', color: '#0052CC',
    description: 'Turn onboarding and offboarding checklists into Jira tickets for IT and facilities.', features: ['Onboarding tickets', 'Offboarding tickets', 'Status sync'] },
  { id: 'trello', iconSlug: 'trello', name: 'Trello', category: 'Project Management', availability: 'roadmap', color: '#0079BF',
    description: 'Mirror the recruitment pipeline and onboarding checklists on Trello boards.', features: ['Board sync', 'Checklist cards', 'Due dates'] },
  { id: 'asana', iconSlug: 'asana', name: 'Asana', category: 'Project Management', availability: 'roadmap', color: '#F06A6A',
    description: 'Create onboarding projects from templates for every new hire.', features: ['Onboarding templates', 'Task assignment', 'Progress tracking'] },

  // Learning
  { id: 'linkedin-learning', iconSlug: 'linkedin', name: 'LinkedIn Learning', category: 'Learning', availability: 'roadmap', color: '#0A66C2',
    description: 'Assign courses during onboarding and track completion.', features: ['Course assignment', 'Completion tracking', 'Learning paths'] },

  // Automation & development
  { id: 'zapier', iconSlug: 'zapier', name: 'Zapier', category: 'Automation', availability: 'roadmap', color: '#FF4F00',
    description: 'Trigger workflows in 6,000+ apps when people join, leave or request time off.', features: ['Joiner / leaver triggers', 'Leave triggers', 'Custom actions'] },
  { id: 'github', iconSlug: 'github', name: 'GitHub', category: 'Development', availability: 'roadmap', color: '#181717',
    logoUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    description: 'Add and remove engineers from your GitHub organization as they join and leave.', features: ['Org membership on join', 'Removal on exit', 'Team mapping'] },
];

export const CATEGORIES = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));
