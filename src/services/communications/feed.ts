import mongoose from 'mongoose';
import type { gmail_v1, calendar_v3 } from 'googleapis';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import '@/models/Employee';
import { getCalendarService, getGmailService } from '@/services/google';
import type { CommItem, CommPlatform, CommSourceStatus } from '@/lib/communications';

const EMAIL_LIMIT = 15;
const EVENT_LIMIT = 25;
const COMMUNITY_LIMIT = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

type SourceResult = { items: CommItem[]; status: CommSourceStatus };

const header = (headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string) =>
  headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';

/** "Jane Doe <jane@x.com>" → "Jane Doe"; first address only. */
const displayName = (address: string) => {
  const first = address.split(',')[0].trim();
  const match = first.match(/^"?([^"<]+?)"?\s*<.+>$/);
  return (match ? match[1] : first) || 'Unknown';
};

async function readMailbox(gmail: gmail_v1.Gmail, label: 'INBOX' | 'SENT'): Promise<CommItem[]> {
  const list = await gmail.users.messages.list({ userId: 'me', labelIds: [label], maxResults: EMAIL_LIMIT });
  const messages = await Promise.all(
    (list.data.messages ?? []).map((m) =>
      // Metadata only: who, subject and when. Bodies are never read here.
      gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] })
    )
  );
  return messages.map(({ data }) => {
    const headers = data.payload?.headers;
    return {
      id: `gmail-${data.id}`,
      source: 'gmail',
      platform: 'Email',
      counterpart: displayName(header(headers, label === 'SENT' ? 'To' : 'From')),
      summary: header(headers, 'Subject') || '(no subject)',
      type: label === 'SENT' ? 'Sent' : data.labelIds?.includes('UNREAD') ? 'Received · unread' : 'Received',
      at: new Date(Number(data.internalDate) || Date.now()).toISOString(),
      link: '/gmail-inbox',
    } satisfies CommItem;
  });
}

async function fromGmail(userId: string): Promise<SourceResult> {
  const status: CommSourceStatus = { id: 'gmail', label: 'Gmail', state: 'not-connected', count: 0 };
  const gmail = await getGmailService(userId);
  if (!gmail) return { items: [], status };
  try {
    const items = (await Promise.all([readMailbox(gmail, 'INBOX'), readMailbox(gmail, 'SENT')])).flat();
    return { items, status: { ...status, state: 'connected', count: items.length } };
  } catch (error) {
    console.error('[communications] Gmail read failed:', (error as Error).message);
    return { items: [], status: { ...status, state: 'error', message: 'Could not read Gmail. Try reconnecting Google in Integrations.' } };
  }
}

function meetingPlatform(event: calendar_v3.Schema$Event): CommPlatform {
  const text = `${event.location ?? ''} ${event.description ?? ''} ${event.conferenceData?.conferenceSolution?.name ?? ''}`.toLowerCase();
  if (event.hangoutLink || text.includes('meet.google.com') || text.includes('google meet')) return 'Google Meet';
  if (text.includes('zoom.us') || text.includes('zoom')) return 'Zoom';
  if (text.includes('teams.microsoft') || text.includes('microsoft teams')) return 'Microsoft Teams';
  return 'Calendar';
}

async function fromCalendar(userId: string): Promise<SourceResult> {
  const status: CommSourceStatus = { id: 'calendar', label: 'Google Calendar', state: 'not-connected', count: 0 };
  const calendar = await getCalendarService(userId);
  if (!calendar) return { items: [], status };
  try {
    const now = Date.now();
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(now - 14 * DAY_MS).toISOString(),
      timeMax: new Date(now + 7 * DAY_MS).toISOString(),
      maxResults: EVENT_LIMIT,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const items = (data.items ?? [])
      .filter((event) => event.status !== 'cancelled')
      .map((event) => {
        const start = event.start?.dateTime ?? event.start?.date ?? new Date().toISOString();
        const isPast = new Date(start).getTime() < now;
        const self = event.attendees?.find((a) => a.self);
        const others = (event.attendees ?? []).filter((a) => !a.self).length;
        const type = !isPast ? 'Upcoming meeting' : self?.responseStatus === 'declined' ? 'Declined' : 'Meeting';
        return {
          id: `calendar-${event.id}`,
          source: 'calendar',
          platform: meetingPlatform(event),
          counterpart: event.organizer?.self
            ? others ? `You + ${others} guest${others === 1 ? '' : 's'}` : 'Just you'
            : event.organizer?.displayName || event.organizer?.email || 'Unknown organizer',
          summary: event.summary || '(no title)',
          type,
          at: new Date(start).toISOString(),
          link: event.htmlLink ?? null,
        } satisfies CommItem;
      });
    return { items, status: { ...status, state: 'connected', count: items.length } };
  } catch (error) {
    console.error('[communications] Calendar read failed:', (error as Error).message);
    return { items: [], status: { ...status, state: 'error', message: 'Could not read Google Calendar. Try reconnecting Google in Integrations.' } };
  }
}

async function fromCommunity(organizationId: string | null): Promise<SourceResult> {
  const status: CommSourceStatus = { id: 'community', label: 'Community', state: 'connected', count: 0 };
  if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) return { items: [], status };
  await dbConnect();
  const posts = await Post.find({ organizationId }).sort({ createdAt: -1 }).limit(COMMUNITY_LIMIT).populate('author', 'name').lean();
  const postIds = (await Post.find({ organizationId }).select('_id').lean()).map((p) => p._id);
  const comments = await Comment.find({ post: { $in: postIds } }).sort({ createdAt: -1 }).limit(COMMUNITY_LIMIT)
    .populate('author', 'name').populate('post', 'subject').lean();
  const name = (author: unknown) => (author as { name?: string } | null)?.name ?? 'Former member';
  const items: CommItem[] = [
    ...posts.map((post) => ({
      id: `post-${post._id}`, source: 'community' as const, platform: 'Community' as const,
      counterpart: name(post.author), summary: post.subject, type: `Post · ${post.topic}`,
      at: new Date(post.createdAt).toISOString(), link: '/community',
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment._id}`, source: 'community' as const, platform: 'Community' as const,
      counterpart: name(comment.author), summary: `On “${(comment.post as { subject?: string } | null)?.subject ?? 'a post'}”`, type: 'Comment',
      at: new Date(comment.createdAt).toISOString(), link: '/community',
    })),
  ];
  return { items, status: { ...status, count: items.length } };
}

/**
 * The signed-in person's recent communications: their own Gmail and Calendar
 * (when they've connected Google) and their organization's Community activity.
 */
export async function getCommunicationsFeed(userId: string, organizationId: string | null) {
  const results = await Promise.all([fromGmail(userId), fromCalendar(userId), fromCommunity(organizationId)]);
  return {
    items: results.flatMap((r) => r.items).sort((a, b) => b.at.localeCompare(a.at)),
    sources: results.map((r) => r.status),
  };
}
