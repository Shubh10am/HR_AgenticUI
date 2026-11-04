import mongoose from 'mongoose';
import Comment from '@/models/Comment';
import { communityRoute } from '@/services/community/route';
import { CommunityError, feedPostById, ownedPost, type Viewer } from '@/services/community/feed';
import type { NextApiRequestWithAuth } from '@/lib/withAuth';

const EDIT_WINDOW_MS = 24 * 3_600_000;

async function load(viewer: Viewer, req: NextApiRequestWithAuth) {
  const post = await ownedPost(viewer, req.query.postId);
  const { commentId } = req.query;
  if (typeof commentId !== 'string' || !mongoose.isValidObjectId(commentId)) throw new CommunityError('Invalid comment.');
  const comment = await Comment.findById(commentId);
  if (!comment || String(comment.post) !== String(post._id)) throw new CommunityError('Comment not found.', 404);
  return { post, comment, isAuthor: String(comment.author) === viewer.id };
}

/** Edit your own comment within 24 hours; delete your own (or any, as HR or admin) along with its replies. */
export default communityRoute({
  PUT: async (viewer, req) => {
    const { post, comment, isAuthor } = await load(viewer, req);
    if (!isAuthor) throw new CommunityError('You can only edit your own comments.', 403);
    if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) throw new CommunityError('Comments can only be edited within 24 hours.', 403);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim().slice(0, 2000) : '';
    if (!content) throw new CommunityError('Comment content cannot be empty.');
    comment.content = content;
    await comment.save();
    return feedPostById(viewer, String(post._id));
  },
  DELETE: async (viewer, req) => {
    const { post, comment, isAuthor } = await load(viewer, req);
    const canModerate = ['Admin', 'HR', 'SuperAdmin'].includes(viewer.role);
    if (!isAuthor && !canModerate) throw new CommunityError('You can only delete your own comments.', 403);
    const gone = [comment._id, ...(await Comment.find({ parent: comment._id }).distinct('_id'))].map(String);
    await Comment.deleteMany({ _id: { $in: gone } });
    post.comments = post.comments.filter((id) => !gone.includes(String(id)));
    await post.save();
    return feedPostById(viewer, String(post._id));
  },
});
