
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Employee from '@/models/Employee';
import Organization from '@/models/Organization';
import { verifyToken } from '@/lib/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken || decodedToken.role !== 'SuperAdmin' && decodedToken.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to SuperAdmins.' });
  }

  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        select: 'name',
        model: Employee,
      })
      .populate({
        path: 'organizationId',
        select: 'name',
        model: Organization,
      })
      .lean();

    const formattedPosts = posts.map(post => ({
        ...post,
        organization: post.organizationId, // Remap for easier frontend access
    }));

    return res.status(200).json(formattedPosts);
  } catch (error) {
    console.error("Error fetching all community posts for admin:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
