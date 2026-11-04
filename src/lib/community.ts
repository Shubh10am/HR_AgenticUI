/** Shared between the community API and the feed UI. Safe to import on the client. */

export type PostKind = 'update' | 'announcement' | 'kudos' | 'poll' | 'event' | 'achievement';

export const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'insight', emoji: '💡', label: 'Insightful' },
  { key: 'support', emoji: '🙌', label: 'Support' },
] as const;
export type ReactionKey = (typeof REACTIONS)[number]['key'];
export const isReactionKey = (value: unknown): value is ReactionKey => REACTIONS.some((reaction) => reaction.key === value);

export const KUDOS_VALUES = ['Team player', 'Above and beyond', 'Customer first', 'Innovator', 'Mentor', 'Problem solver'] as const;

export const POST_KIND_META: Record<PostKind, { label: string; tone: string; staffOnly?: boolean }> = {
  update: { label: 'Update', tone: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' },
  announcement: { label: 'Announcement', tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300', staffOnly: true },
  kudos: { label: 'Kudos', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  poll: { label: 'Poll', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
  event: { label: 'Event', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  achievement: { label: 'Achievement', tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
};

/** Roles that may publish announcements and pin posts. */
export const STAFF_ROLES = ['Admin', 'HR', 'Manager', 'SuperAdmin'];
export const isStaff = (role: string | undefined) => !!role && STAFF_ROLES.includes(role);

export interface FeedPerson {
  id: string;
  name: string;
  department: string;
}

export interface FeedComment {
  id: string;
  /** Null while the comment's author has left the organisation. */
  author: FeedPerson | null;
  content: string;
  parentId: string | null;
  createdAt: string;
  mine: boolean;
}

export interface FeedPost {
  id: string;
  kind: PostKind;
  /** Null for anonymous posts — the author is never sent to the browser. */
  author: FeedPerson | null;
  anonymous: boolean;
  mine: boolean;
  topic: string;
  subject: string;
  content: string;
  pinned: boolean;
  saved: boolean;
  reactions: Record<ReactionKey, number>;
  myReaction: ReactionKey | null;
  comments: FeedComment[];
  kudos?: { recipient: FeedPerson | null; value: string };
  poll?: { options: { id: string; label: string; votes: number }[]; myVote: string | null; totalVotes: number; closesAt: string | null; closed: boolean };
  event?: { startsAt: string; location: string; goingCount: number; going: boolean };
  createdAt: string;
}

export interface Celebration {
  person: FeedPerson;
  kind: 'birthday' | 'anniversary' | 'new-joiner';
  /** ISO date of the celebration this year (or the joining day for new joiners). */
  date: string;
  years?: number;
}

export interface CommunityHighlights {
  celebrations: Celebration[];
  topKudos: { person: FeedPerson; count: number }[];
  trending: { tag: string; count: number }[];
  upcomingEvents: { postId: string; subject: string; startsAt: string; location: string; goingCount: number }[];
  myBirthday: { month: number; day: number } | null;
}

export interface NewPostInput {
  kind: PostKind;
  topic?: string;
  subject?: string;
  content: string;
  anonymous?: boolean;
  kudos?: { recipientId: string; value: string };
  poll?: { options: string[]; closesInDays?: number };
  event?: { startsAt: string; location?: string };
}

/** Hashtags in a post, lower-cased and without the '#'. */
export const hashtagsOf = (text: string) => Array.from(new Set((text.match(/#[\p{L}\p{N}_]{2,40}/gu) ?? []).map((tag) => tag.slice(1).toLowerCase())));

export const emptyReactions = (): Record<ReactionKey, number> =>
  Object.fromEntries(REACTIONS.map((reaction) => [reaction.key, 0])) as Record<ReactionKey, number>;
