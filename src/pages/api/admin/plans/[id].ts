import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { requirePlatformAdmin } from '@/lib/platform-admin';
import { recordAudit } from '@/services/audit/record';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { parsePlan } from '@/services/platform/plans';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = requirePlatformAdmin(req, res);
  if (!admin) return;
  const audit = (status: number) => void recordAudit(req, { id: admin.employeeId, name: admin.name, email: admin.email, role: admin.role }, status);
  const id = String(req.query.id);
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid plan ID.' });

  try {
    await dbConnect();
    if (req.method === 'PUT') {
      const { plan, error } = parsePlan(req.body ?? {});
      if (!plan) return res.status(400).json({ error });
      const updated = await SubscriptionPlan.findByIdAndUpdate(id, plan, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Plan not found.' });
      audit(200);
      return res.status(200).json({ plan: { ...updated, _id: String(updated._id) } });
    }
    if (req.method === 'DELETE') {
      const deleted = await SubscriptionPlan.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Plan not found.' });
      audit(204);
      return res.status(204).end();
    }
    res.setHeader('Allow', 'PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('[admin] Plan request failed:', error);
    return res.status(500).json({ error: 'Could not update the plan.' });
  }
}
