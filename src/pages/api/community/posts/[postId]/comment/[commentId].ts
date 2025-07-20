
import type { NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import mongoose from 'mongoose';
import { differenceInHours } from 'date-fns';
import Employee from '@/models/Employee';

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { id: employeeId, role } = req.user;
  const { postId, commentId } = req.query;

  if (!postId || typeof postId !== 'string' || !mongoose.Types.ObjectId.isValid(postId) ||
      !commentId || typeof commentId !== 'string' || !mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ error: 'Invalid Post or Comment ID.' });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found.' });
  }

  // Ensure the comment belongs to the post
  if (comment.post.toString() !== post._id.toString()) {
    return res.status(400).json({ error: 'Comment does not belong to this post.' });
  }
  
  const isAuthor = comment.author.toString() === employeeId;
  const isAdmin = role === 'Admin';
  const isWithin24Hours = differenceInHours(new Date(), new Date(comment.createdAt)) < 24;


  if (req.method === 'DELETE') {
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this comment.' });
    }

    try {
      await Comment.findByIdAndDelete(commentId);
      post.comments.pull(new mongoose.Types.ObjectId(commentId as string));
      await post.save();
      
      const updatedPost = await Post.findById(postId)
        .populate('author', 'name')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'name', model: Employee },
          options: { sort: { createdAt: 1 } },
        })
        .lean();

      return res.status(200).json(updatedPost);
    } catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'PUT') {
    if (!isAuthor) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own comments.' });
    }
    if (!isWithin24Hours) {
      return res.status(403).json({ error: 'Forbidden: Comments can only be edited within 24 hours.' });
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }
    
    try {
      comment.content = content.trim();
      await comment.save();

      const updatedPost = await Post.findById(postId)
        .populate('author', 'name')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'name', model: Employee },
          options: { sort: { createdAt: 1 } },
        })
        .lean();
      
      return res.status(200).json(updatedPost);
    } catch (error) {
      console.error('Error updating comment:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['DELETE', 'PUT']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withAuth(handler);
