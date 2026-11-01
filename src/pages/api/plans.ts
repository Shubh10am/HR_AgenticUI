import type { NextApiRequest, NextApiResponse } from 'next';
import { listPlans } from '@/services/platform/plans';

/** Public: active subscription plans, for a pricing page. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const plans = await listPlans(true);
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json({ plans: plans.map(({ _id, name, description, price, currency, interval, features, isHighlighted }) => ({ _id, name, description, price, currency, interval, features, isHighlighted })) });
  } catch (error) {
    console.error('[plans] Failed to list plans:', error);
    return res.status(500).json({ error: 'Could not load plans.' });
  }
}
