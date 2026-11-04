import type { Evidence } from '../contracts';

export const launchEvidence: Evidence[] = [
  { provider: 'jira', kind: 'work item', title: 'Verify launch deployment', detail: 'Production verification is blocked until the release window is confirmed.', reference: 'LAUNCH-42', owner: 'Release team', status: 'blocked', url: 'https://example.com/issues/LAUNCH-42' },
  { provider: 'github', kind: 'code change', title: 'Merge onboarding fix', detail: 'The onboarding fix merged. The PR does not confirm a production deployment.', reference: 'LAUNCH-42', owner: 'Engineering', status: 'done', url: 'https://example.com/pull/42' },
  { provider: 'slack', kind: 'discussion', title: 'Hold the campaign announcement', detail: 'Marketing agreed to wait for production verification before announcing the launch.', reference: 'LAUNCH-42', owner: 'Marketing', status: 'decision', url: 'https://example.com/launch-thread' },
];
