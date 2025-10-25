
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import TokenUsageLog from '@/models/TokenUsageLog';
import { verifyToken } from '@/lib/jwt';
import { startOfDay, endOfDay, subDays } from 'date-fns';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || (decodedToken.role !== 'SuperAdmin' && decodedToken.role !== 'Admin')) {
    return res.status(403).json({ error: 'Forbidden: Access restricted.' });
  }

  await dbConnect();

  try {
    const { type, days = '7' } = req.query;
    const periodDays = parseInt(days as string, 10);
    const endDate = new Date();
    const startDate = subDays(endDate, periodDays);

    if (type === 'kpis') {
      const [totalUsers, totalOrganizations, totalTokensUsed] = await Promise.all([
        Employee.countDocuments(),
        Organization.countDocuments(),
        TokenUsageLog.aggregate([
          { $group: { _id: null, total: { $sum: '$totalTokens' } } },
        ]),
      ]);

      return res.status(200).json({
        totalUsers,
        totalOrganizations,
        totalTokensUsed: totalTokensUsed[0]?.total || 0,
      });
    }

    if (type === 'usageOverTime') {
        const usage = await TokenUsageLog.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    ai: { $sum: '$totalTokens' }, // Using total tokens as a proxy for AI calls
                    // Simulating backend calls. In a real app, this would come from a different log.
                    backend: { $sum: { $multiply: [ { $sum: '$totalTokens' }, { $add: [20, { $multiply: [Math.random(), 30] }] } ] } }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', ai: 1, backend: 1, _id: 0 } }
        ]);
        return res.status(200).json(usage);
    }
    
    if (type === 'featureUsage') {
        const featureUsage = await TokenUsageLog.aggregate([
            { $group: { _id: '$feature', usage: { $sum: 1 } } },
            { $sort: { usage: -1 } },
            { $project: { name: '$_id', usage: 1, _id: 0 } }
        ]);
        return res.status(200).json(featureUsage);
    }
    
    if (type === 'newUserSignups') {
         const signups = await Employee.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    signups: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', signups: 1, _id: 0 } }
        ]);
        return res.status(200).json(signups);
    }


    return res.status(400).json({ error: 'Invalid analytics type specified.' });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default handler;

    