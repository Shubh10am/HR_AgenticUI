import mongoose from 'mongoose';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import { isReactionKey, isStaff, type FeedPost } from '@/lib/community';
import { CommunityError, feedPostById, ownedPost, type Viewer } from './feed';

const same = (a: unknown, b: string) => String(a) === b;
const oid = (id: string) => new mongoose.Types.ObjectId(id);

/** Sets the viewer's reaction; choosing the same one again removes it. One reaction per person. */
export async function react(viewer: Viewer, postId: unknown, emoji: unknown): Promise<FeedPost> {
  if (!isReactionKey(emoji)) throw new CommunityError('Unknown reaction.');
  const post = await ownedPost(viewer, postId);
  const previous = post.reactions.find((reaction) => same(reaction.employee, viewer.id))?.emoji ?? (post.likes.some((id) => same(id, viewer.id)) ? 'like' : null);
  post.reactions = post.reactions.filter((reaction) => !same(reaction.employee, viewer.id));
  post.likes = post.likes.filter((id) => !same(id, viewer.id));
  if (previous !== emoji) post.reactions.push({ employee: oid(viewer.id), emoji });
  await post.save();
  return feedPostById(viewer, String(post._id));
}

/** Casts or moves the viewer's vote. */
export async function vote(viewer: Viewer, postId: unknown, optionId: unknown): Promise<FeedPost> {
  const post = await ownedPost(viewer, postId);
  if (!post.poll) throw new CommunityError('This post is not a poll.');
  if (post.poll.closesAt && post.poll.closesAt.getTime() < Date.now()) throw new CommunityError('This poll has closed.');
  const option = post.poll.options.find((candidate) => same(candidate._id, String(optionId)));
  if (!option) throw new CommunityError('Unknown poll option.');
  for (const candidate of post.poll.options) candidate.votes = candidate.votes.filter((id) => !same(id, viewer.id));
  option.votes.push(oid(viewer.id));
  post.markModified('poll');
  await post.save();
  return feedPostById(viewer, String(post._id));
}

/** Toggles the viewer's "going" on an event. */
export async function rsvp(viewer: Viewer, postId: unknown): Promise<FeedPost> {
  const post = await ownedPost(viewer, postId);
  if (!post.event) throw new CommunityError('This post is not an event.');
  const going = post.event.going.some((id) => same(id, viewer.id));
  post.event.going = going ? post.event.going.filter((id) => !same(id, viewer.id)) : [...post.event.going, oid(viewer.id)];
  post.markModified('event');
  await post.save();
  return feedPostById(viewer, String(post._id));
}

/** Toggles a bookmark. Only the viewer sees their saved posts. */
export async function toggleSaved(viewer: Viewer, postId: unknown): Promise<FeedPost> {
  const post = await ownedPost(viewer, postId);
  const saved = post.savedBy.some((id) => same(id, viewer.id));
  post.savedBy = saved ? post.savedBy.filter((id) => !same(id, viewer.id)) : [...post.savedBy, oid(viewer.id)];
  await post.save();
  return feedPostById(viewer, String(post._id));
}

/** Marks an announcement as read by the viewer. Repeating it changes nothing. */
export async function markRead(viewer: Viewer, postId: unknown): Promise<FeedPost> {
  const post = await ownedPost(viewer, postId);
  if (post.kind !== 'announcement') throw new CommunityError('Only announcements take read receipts.');
  await Post.updateOne({ _id: post._id, 'readBy.employee': { $ne: oid(viewer.id) } }, { $push: { readBy: { employee: oid(viewer.id), at: new Date() } } });
  return feedPostById(viewer, String(post._id));
}

/** Pins or unpins a post to the top of the feed (HR, managers and admins). */
export async function setPinned(viewer: Viewer, postId: unknown, pinned: boolean): Promise<FeedPost> {
  if (!isStaff(viewer.role)) throw new CommunityError('Only HR, managers and admins can pin posts.', 403);
  const post = await ownedPost(viewer, postId);
  post.pinned = pinned;
  await post.save();
  return feedPostById(viewer, String(post._id));
}

/** Deletes a post and its comments. Authors may delete their own; HR and admins may delete any. */
export async function deletePost(viewer: Viewer, postId: unknown): Promise<void> {
  const post = await ownedPost(viewer, postId);
  const canModerate = viewer.role === 'Admin' || viewer.role === 'HR' || viewer.role === 'SuperAdmin';
  if (!same(post.author, viewer.id) && !canModerate) throw new CommunityError('You can only delete your own posts.', 403);
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
}
