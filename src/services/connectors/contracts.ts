import { z } from 'zod';

export const providerIds = ['jira', 'github', 'slack', 'teams', 'crm', 'hr', 'devops', 'salesforce', 'workday', 'pagerduty', 'github-actions'] as const;
export const evidenceSchema = z.object({
  provider: z.enum(providerIds),
  kind: z.enum(['work item', 'code change', 'discussion', 'commitment', 'event']),
  title: z.string().trim().min(1).max(160),
  detail: z.string().trim().min(1).max(2000),
  url: z.string().url().max(2048).refine((url) => /^https?:\/\//i.test(url), 'Use an HTTP or HTTPS link'),
  reference: z.string().trim().max(80),
  owner: z.string().trim().max(100),
  status: z.enum(['update', 'blocked', 'decision', 'done']),
});

export type Evidence = z.infer<typeof evidenceSchema>;

export interface ConnectorScope {
  organizationId: string;
  employeeId: string;
  resourceIds: readonly string[];
}

/** Live adapters must check both the selected resource scope and the caller's source access. */
export interface ConnectorAdapter {
  provider: Evidence['provider'];
  readEvidence(scope: ConnectorScope): Promise<Evidence[]>;
}
