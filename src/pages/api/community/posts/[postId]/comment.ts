
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import mongoose from 'mongoose';
import Employee from '@/models/Employee';

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { id: employeeId } = req.user;
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

    // Optional: Check if the user belongs to the same organization as the post
    if (post.organizationId.toString() !== req.user.organizationId) {
        return res.status(403).json({ error: 'Forbidden: You cannot comment on posts outside your organization.' });
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

export default withAuth(handler);
