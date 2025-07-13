
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';
import Employee from '@/models/Employee';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

  const { employeeId } = decodedToken;
  const { postId } = req.query;
  const { content } = req.body;

  if (!postId || typeof postId !== 'string' || !mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: 'Invalid Post ID.' });
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const newComment = new Comment({
      post: post._id,
      author: employeeId,
      content: content.trim(),
    });

    await newComment.save();

    post.comments.push(newComment._id);
    await post.save();
    
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name', model: Employee },
        options: { sort: { createdAt: 1 } },
      })
      .lean();

    res.status(201).json(updatedPost);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
