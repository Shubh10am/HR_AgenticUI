
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { verifyToken } from '@/lib/jwt';
import Employee from '@/models/Employee';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const { employeeId, organizationId, role } = decodedToken;

  switch (req.method) {
    case 'GET':
      try {
        const posts = await Post.find({ organizationId })
          .sort({ createdAt: -1 })
          .populate({
            path: 'author',
            select: 'name',
            model: Employee,
          })
          .populate({
            path: 'comments',
            populate: {
              path: 'author',
              select: 'name',
              model: Employee,
            },
            options: { sort: { createdAt: 1 } },
          })
          .lean();

        res.status(200).json(posts);
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error fetching posts.' });
      }
      break;

    case 'POST':
      if (role !== 'Admin' && role !== 'HR' && role !== 'Manager') {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to create a post.' });
      }
      const { topic, subject, content } = req.body;
      if (!topic || !subject || !content || !topic.trim() || !subject.trim() || !content.trim()) {
        return res.status(400).json({ error: 'Topic, subject, and content are required.' });
      }

      try {
        const newPost = new Post({
          organizationId,
          author: employeeId,
          topic,
          subject,
          content,
        });
        await newPost.save();
        
        // Populate the author details for the response
        const populatedPost = await Post.findById(newPost._id).populate('author', 'name').lean();
        
        res.status(201).json(populatedPost);
      } catch (error) {
        res.status(500).json({ error: 'Internal Server Error creating post.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
