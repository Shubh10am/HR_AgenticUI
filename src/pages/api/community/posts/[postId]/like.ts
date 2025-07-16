
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import mongoose from 'mongoose';
import Employee from '@/models/Employee';

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { id: employeeId } = req.user;
  const { postId } = req.query;

  if (!postId || typeof postId !== 'string' || !mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: 'Invalid Post ID.' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Optional: Check if the user belongs to the same organization as the post
    if (post.organizationId.toString() !== req.user.organizationId) {
        return res.status(403).json({ error: 'Forbidden: You cannot like posts outside your organization.' });
    }

    const userId = new mongoose.Types.ObjectId(employeeId);
    const likeIndex = post.likes.findIndex(id => id.equals(userId));

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('author', 'name')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name' },
        options: { sort: { createdAt: 1 } },
      })
      .lean();

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default withAuth(handler);
