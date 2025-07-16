
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import Employee from '@/models/Employee';

async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const { id: employeeId, organizationId, role } = req.user;

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
      console.log(topic, subject, content)
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
        
        const populatedPost = await Post.findById(newPost._id)
            .populate({ path: 'author', select: 'name', model: Employee })
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'name', model: Employee },
            })
            .lean();
        
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

export default withAuth(handler);
