
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import TokenUsageLog from '@/models/TokenUsageLog';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
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

async function handler(
  req: NextApiRequestWithAuth,
  res: NextApiResponse<UsageResponse | { error: string }>
) {
  const { organizationId } = req.user;

  try {
    const now = new Date();
    const cycleStartDate = startOfMonth(now);
    const cycleEndDate = endOfMonth(now);

    const result = await TokenUsageLog.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId as string), // Cast to prevent TS error
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

export default withAuth(handler);
