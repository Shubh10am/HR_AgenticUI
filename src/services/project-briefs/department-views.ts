import type { ProjectBrief } from './schema';

export const departmentViews: Record<ProjectBrief['department'], { focus: string; question: string }> = {
  'Cross-team': { focus: 'Dependencies, owners, and upcoming decisions', question: 'What is blocked across teams, and who owns the next step?' },
  Sales: { focus: 'Customer commitments and delivery dependencies', question: 'Which customer commitments are at risk and why?' },
  Marketing: { focus: 'Campaign approvals and launch readiness', question: 'What needs approval before we announce the launch?' },
  HR: { focus: 'Onboarding tasks and handoffs to hiring managers or IT', question: 'Which onboarding tasks still need an owner or a response?' },
  Engineering: { focus: 'Open reviews, release blockers, and deployments', question: 'Which changes have merged, and what still needs verification?' },
  Security: { focus: 'Incident follow-up and remediation owners', question: 'What is the incident timeline and which remediation tasks are open?' },
  DevOps: { focus: 'Deployment status and operational follow-up', question: 'What was deployed, what failed, and what needs follow-up?' },
};
