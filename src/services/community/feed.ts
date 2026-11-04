import mongoose from 'mongoose';
import Post, { type IPost } from '@/models/Post';
import Comment from '@/models/Comment';
import Employee from '@/models/Employee';
import {
  KUDOS_VALUES,
  POST_KIND_META,
  emptyReactions,
  isReactionKey,
  isStaff,
  type FeedComment,
  type FeedPerson,
  type FeedPost,
  type NewPostInput,
  type PostKind,
  type ReactionKey,
} from '@/lib/community';

/** A refusal the API turns into a 4xx with this message. */
export class CommunityError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export interface Viewer {
  id: string;
  organizationId: string;
  role: string;
}

const FEED_LIMIT = 200;
const PERSON_FIELDS = 'name department';

type PersonDoc = { _id: unknown; name?: string; department?: string } | null | undefined;
const personOf = (doc: PersonDoc): FeedPerson | null =>
  doc && typeof doc === 'object' && 'name' in doc ? { id: String(doc._id), name: doc.name ?? 'Unknown', department: doc.department ?? '' } : null;

const idOf = (value: unknown) => String((value as { _id?: unknown })?._id ?? value);

/** Turns a stored post into what the viewer may see. Anonymous authors are dropped here, before anything leaves the server. */
export function toFeedPost(post: any, viewerId: string): FeedPost {
  const reactions = emptyReactions();
  let myReaction: ReactionKey | null = null;
  const counted = new Set<string>();
  for (const reaction of post.reactions ?? []) {
    if (!isReactionKey(reaction.emoji)) continue;
    const who = idOf(reaction.employee);
    counted.add(who);
    reactions[reaction.emoji] += 1;
    if (who === viewerId) myReaction = reaction.emoji;
  }
  for (const like of post.likes ?? []) {
    const who = idOf(like);
    if (counted.has(who)) continue;
    reactions.like += 1;
    if (who === viewerId) myReaction = 'like';
  }

  const comments: FeedComment[] = (post.comments ?? [])
    .filter((comment: any) => comment && typeof comment === 'object' && 'content' in comment)
    .map((comment: any) => ({
      id: String(comment._id),
      author: personOf(comment.author),
      content: comment.content,
      parentId: comment.parent ? String(comment.parent) : null,
      createdAt: new Date(comment.createdAt).toISOString(),
      mine: idOf(comment.author) === viewerId,
    }));

  const feed: FeedPost = {
    id: String(post._id),
    kind: (post.kind ?? 'update') as PostKind,
    author: post.anonymous ? null : personOf(post.author),
    anonymous: !!post.anonymous,
    mine: idOf(post.author) === viewerId,
    topic: post.topic ?? 'General',
    subject: post.subject ?? '',
    content: post.content,
    pinned: !!post.pinned,
    saved: (post.savedBy ?? []).some((id: unknown) => idOf(id) === viewerId),
    reactions,
    myReaction,
    comments,
    createdAt: new Date(post.createdAt).toISOString(),
  };

  if (post.kudos) feed.kudos = { recipient: personOf(post.kudos.recipient), value: post.kudos.value };
  if (post.poll) {
    const closesAt = post.poll.closesAt ? new Date(post.poll.closesAt) : null;
    const options = (post.poll.options ?? []).map((option: any) => ({ id: String(option._id), label: option.label, votes: option.votes?.length ?? 0 }));
    const mine = (post.poll.options ?? []).find((option: any) => (option.votes ?? []).some((id: unknown) => idOf(id) === viewerId));
    feed.poll = {
      options,
      myVote: mine ? String(mine._id) : null,
      totalVotes: options.reduce((total: number, option: { votes: number }) => total + option.votes, 0),
      closesAt: closesAt?.toISOString() ?? null,
      closed: !!closesAt && closesAt.getTime() < Date.now(),
    };
  }
  if (post.event) {
    feed.event = {
      startsAt: new Date(post.event.startsAt).toISOString(),
      location: post.event.location ?? '',
      goingCount: post.event.going?.length ?? 0,
      going: (post.event.going ?? []).some((id: unknown) => idOf(id) === viewerId),
    };
  }
  return feed;
}

const populated = <T>(query: mongoose.Query<T, any>) =>
  query
    .populate({ path: 'author', select: PERSON_FIELDS, model: Employee })
    .populate({ path: 'kudos.recipient', select: PERSON_FIELDS, model: Employee })
    .populate({ path: 'comments', options: { sort: { createdAt: 1 } }, populate: { path: 'author', select: PERSON_FIELDS, model: Employee } });

/** The organisation's feed, pinned posts first. */
export async function listFeed(viewer: Viewer): Promise<FeedPost[]> {
  const posts = await populated(Post.find({ organizationId: viewer.organizationId }).sort({ pinned: -1, createdAt: -1 }).limit(FEED_LIMIT)).lean();
  return posts.map((post) => toFeedPost(post, viewer.id));
}

/** One post as the viewer sees it, after a change. */
export async function feedPostById(viewer: Viewer, postId: string): Promise<FeedPost> {
  const post = await populated(Post.findById(postId)).lean();
  if (!post) throw new CommunityError('Post not found.', 404);
  return toFeedPost(post, viewer.id);
}

/** Loads a post the viewer's organisation owns, or refuses. */
export async function ownedPost(viewer: Viewer, postId: unknown): Promise<IPost> {
  if (typeof postId !== 'string' || !mongoose.isValidObjectId(postId)) throw new CommunityError('Invalid post.');
  const post = await Post.findById(postId);
  if (!post || String(post.organizationId) !== viewer.organizationId) throw new CommunityError('Post not found.', 404);
  return post;
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Validates and publishes a post of any kind. */
export async function createPost(viewer: Viewer, input: Partial<NewPostInput>): Promise<FeedPost> {
  const kind = (input.kind ?? 'update') as PostKind;
  if (!(kind in POST_KIND_META)) throw new CommunityError('Unknown post type.');
  if (POST_KIND_META[kind].staffOnly && !isStaff(viewer.role)) throw new CommunityError('Only HR, managers and admins can publish announcements.', 403);

  const content = text(input.content, 4000);
  if (!content) throw new CommunityError('Write something before posting.');
  const anonymous = !!input.anonymous;
  if (anonymous && kind !== 'update') throw new CommunityError('Only updates and questions can be posted anonymously.');

  const doc: Record<string, unknown> = {
    organizationId: viewer.organizationId,
    author: viewer.id,
    kind,
    anonymous,
    topic: text(input.topic, 40) || POST_KIND_META[kind].label,
    subject: text(input.subject, 140),
    content,
  };

  if (kind === 'kudos') {
    const recipientId = input.kudos?.recipientId;
    const value = text(input.kudos?.value, 40);
    if (!recipientId || !mongoose.isValidObjectId(recipientId)) throw new CommunityError('Choose who the kudos is for.');
    if (recipientId === viewer.id) throw new CommunityError('Kudos go to a colleague, not yourself.');
    if (!(KUDOS_VALUES as readonly string[]).includes(value)) throw new CommunityError('Choose a value for the kudos.');
    const recipient = await Employee.exists({ _id: recipientId, organizationId: viewer.organizationId });
    if (!recipient) throw new CommunityError('That person is not in your organisation.');
    doc.kudos = { recipient: recipientId, value };
  }

  if (kind === 'poll') {
    const options = Array.from(new Set((input.poll?.options ?? []).map((option) => text(option, 80)).filter(Boolean)));
    if (options.length < 2 || options.length > 6) throw new CommunityError('A poll needs between 2 and 6 different options.');
    const days = Number(input.poll?.closesInDays);
    doc.poll = {
      options: options.map((label) => ({ label, votes: [] })),
      closesAt: Number.isFinite(days) && days > 0 ? new Date(Date.now() + Math.min(days, 30) * 86_400_000) : undefined,
    };
  }

  if (kind === 'event') {
    const startsAt = new Date(String(input.event?.startsAt ?? ''));
    if (Number.isNaN(startsAt.getTime())) throw new CommunityError('Choose when the event starts.');
    if (startsAt.getTime() < Date.now() - 3_600_000) throw new CommunityError('The event start is in the past.');
    doc.event = { startsAt, location: text(input.event?.location, 120), going: [viewer.id] };
  }

  const post = await Post.create(doc);
  return feedPostById(viewer, String(post._id));
}

/** Adds a comment, or a reply to a top-level comment. */
export async function addComment(viewer: Viewer, postId: unknown, content: unknown, parentId?: unknown): Promise<FeedPost> {
  const post = await ownedPost(viewer, postId);
  const body = text(content, 2000);
  if (!body) throw new CommunityError('Comment content cannot be empty.');
  let parent: string | null = null;
  if (parentId) {
    const parentComment = typeof parentId === 'string' && mongoose.isValidObjectId(parentId) ? await Comment.findById(parentId).lean() : null;
    if (!parentComment || String(parentComment.post) !== String(post._id)) throw new CommunityError('The comment you replied to is gone.');
    // Replies stay one level deep: replying to a reply joins its thread.
    parent = parentComment.parent ? String(parentComment.parent) : String(parentComment._id);
  }
  const comment = await Comment.create({ post: post._id, author: viewer.id, content: body, parent });
  post.comments.push(comment._id as mongoose.Types.ObjectId);
  await post.save();
  return feedPostById(viewer, String(post._id));
}
