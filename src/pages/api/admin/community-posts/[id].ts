
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid Post ID.' });
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
    const postToDelete = await Post.findById(id);
    if (!postToDelete) {
        return res.status(404).json({ error: 'Post not found.' });
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: id });
    
    // Delete the post itself
    await Post.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Post and associated comments deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting post ${id} for admin:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
