import type { NextApiRequest, NextApiResponse } from 'next';
import { requirePlatformAdmin } from '@/lib/platform-admin';
import { recordAudit } from '@/services/audit/record';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { listPlans, parsePlan } from '@/services/platform/plans';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = requirePlatformAdmin(req, res);
  if (!admin) return;
  const audit = (status: number) => void recordAudit(req, { id: admin.employeeId, name: admin.name, email: admin.email, role: admin.role }, status);
  try {
    if (req.method === 'GET') return res.status(200).json({ plans: await listPlans() });
    if (req.method === 'POST') {
      const { plan, error } = parsePlan(req.body ?? {});
      if (!plan) return res.status(400).json({ error });
      const created = await SubscriptionPlan.create(plan);
      audit(201);
      return res.status(201).json({ plan: { ...created.toObject(), _id: String(created._id) } });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[admin] Plans request failed:', error);
    return res.status(500).json({ error: 'Could not update plans.' });
  }
}
