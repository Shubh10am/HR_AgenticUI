import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import TokenUsageLog from '@/models/TokenUsageLog';
import { verifyToken } from '@/lib/jwt';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';
import mongoose from 'mongoose';


type UsageResponse = {
  usage: number;
  limit: number;
  cycleStartDate: string;
  cycleEndDate: string;
  error?: string;
};

const MOCK_TOKEN_LIMIT = 500000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsageResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { organizationId } = decodedToken;

  try {
    const now = new Date();
    const cycleStartDate = startOfMonth(now);
    const cycleEndDate = endOfMonth(now);

    const result = await TokenUsageLog.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: {
            $gte: cycleStartDate,
            $lte: cycleEndDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$totalTokens' },
        },
      },
    ]);

    const totalUsage = result.length > 0 ? result[0].totalTokens : 0;

    return res.status(200).json({
      usage: totalUsage,
      limit: MOCK_TOKEN_LIMIT,
      cycleStartDate: formatISO(cycleStartDate),
      cycleEndDate: formatISO(cycleEndDate),
    });
  } catch (error: any) {
    console.error('Error fetching token usage:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
