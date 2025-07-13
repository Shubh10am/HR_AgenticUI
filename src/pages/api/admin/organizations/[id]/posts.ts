
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Employee from '@/models/Employee';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

export interface OrgPostData {
  _id: string;
  subject: string;
  authorName: string;
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrgPostData[] | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid Organization ID.' });
  }
  
  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || decodedToken.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to SuperAdmins.' });
  }

  try {
    const posts = await Post.find({ organizationId: id })
      .sort({ createdAt: -1 })
      .limit(20) // Limit to the 20 most recent posts for performance
      .populate({
        path: 'author',
        select: 'name',
        model: Employee,
      })
      .lean();

    const formattedPosts: OrgPostData[] = posts.map(post => ({
      _id: post._id.toString(),
      subject: post.subject,
      authorName: (post.author as any)?.name || 'Unknown Author',
      createdAt: post.createdAt.toISOString(),
    }));

    return res.status(200).json(formattedPosts);
  } catch (error) {
    console.error(`Error fetching posts for organization ${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
