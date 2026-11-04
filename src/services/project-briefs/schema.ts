import { z } from 'zod';
import { evidenceSchema } from '../connectors/contracts';

export const departments = ['Cross-team', 'Sales', 'Marketing', 'HR', 'Engineering', 'Security', 'DevOps'] as const;

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  department: z.enum(departments),
  evidence: z.array(evidenceSchema).max(30),
});

export type ProjectBrief = z.infer<typeof projectSchema>;
export type SavedBrief = ProjectBrief & { id: string };

export function groupEvidence(evidence: ProjectBrief['evidence']) {
  const groups = new Map<string, number[]>();
  evidence.forEach((item, index) => {
    const key = item.reference.trim().toUpperCase();
    if (key) groups.set(key, [...(groups.get(key) ?? []), index]);
  });
  return [...groups].filter(([, records]) => records.length > 1);
}
