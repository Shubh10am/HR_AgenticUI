import Post from '@/models/Post';
import Employee from '@/models/Employee';
import { hashtagsOf, type Celebration, type CommunityHighlights, type FeedPerson } from '@/lib/community';
import { CommunityError, type Viewer } from './feed';

const DAY = 86_400_000;
const NEW_JOINER_DAYS = 30;
const CELEBRATION_WINDOW_DAYS = 30;

const startOfToday = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/** The next time a day/month comes round, today included. */
function nextOccurrence(month: number, day: number, today: Date) {
  const thisYear = new Date(Date.UTC(today.getUTCFullYear(), month - 1, day));
  return thisYear.getTime() >= today.getTime() ? thisYear : new Date(Date.UTC(today.getUTCFullYear() + 1, month - 1, day));
}

/** Sidebar data: celebrations, kudos leaders, trending hashtags and upcoming events. */
export async function communityHighlights(viewer: Viewer): Promise<CommunityHighlights> {
  const today = startOfToday();
  const horizon = today.getTime() + CELEBRATION_WINDOW_DAYS * DAY;
  const people = await Employee.find({ organizationId: viewer.organizationId }).select('name department birthday joinedAt createdAt').lean();
  const personOf = (doc: (typeof people)[number]): FeedPerson => ({ id: String(doc._id), name: doc.name, department: doc.department ?? '' });

  const celebrations: Celebration[] = [];
  let myBirthday: CommunityHighlights['myBirthday'] = null;
  for (const doc of people) {
    if (String(doc._id) === viewer.id && doc.birthday?.month) myBirthday = { month: doc.birthday.month, day: doc.birthday.day };
    if (doc.birthday?.month && doc.birthday.day) {
      const date = nextOccurrence(doc.birthday.month, doc.birthday.day, today);
      if (date.getTime() <= horizon) celebrations.push({ person: personOf(doc), kind: 'birthday', date: date.toISOString() });
    }
    const joined = new Date(doc.joinedAt ?? doc.createdAt);
    if (Number.isNaN(joined.getTime())) continue;
    if (today.getTime() - joined.getTime() <= NEW_JOINER_DAYS * DAY && joined.getTime() <= Date.now()) {
      celebrations.push({ person: personOf(doc), kind: 'new-joiner', date: joined.toISOString() });
      continue;
    }
    const anniversary = nextOccurrence(joined.getUTCMonth() + 1, joined.getUTCDate(), today);
    const years = anniversary.getUTCFullYear() - joined.getUTCFullYear();
    if (years >= 1 && anniversary.getTime() <= horizon) celebrations.push({ person: personOf(doc), kind: 'anniversary', date: anniversary.toISOString(), years });
  }
  celebrations.sort((a, b) => a.date.localeCompare(b.date));
  // New joiners read best most-recent first, at the top.
  celebrations.sort((a, b) => Number(b.kind === 'new-joiner') - Number(a.kind === 'new-joiner'));

  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const recent = await Post.find({ organizationId: viewer.organizationId, createdAt: { $gte: new Date(today.getTime() - 30 * DAY) } })
    .select('content subject kind kudos.recipient createdAt')
    .lean();
  const byId = new Map(people.map((doc) => [String(doc._id), doc]));

  const kudosCount = new Map<string, number>();
  const tagCount = new Map<string, number>();
  for (const post of recent) {
    if (post.kind === 'kudos' && post.kudos?.recipient && new Date(post.createdAt) >= monthStart) {
      const id = String(post.kudos.recipient);
      kudosCount.set(id, (kudosCount.get(id) ?? 0) + 1);
    }
    for (const tag of hashtagsOf(`${post.subject ?? ''} ${post.content}`)) tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
  }
  const topKudos = [...kudosCount.entries()]
    .filter(([id]) => byId.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ person: personOf(byId.get(id)!), count }));
  const trending = [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([tag, count]) => ({ tag, count }));

  const events = await Post.find({ organizationId: viewer.organizationId, kind: 'event', 'event.startsAt': { $gte: new Date(Date.now() - 2 * 3_600_000) } })
    .sort({ 'event.startsAt': 1 })
    .limit(5)
    .select('subject content event')
    .lean();
  const upcomingEvents = events.map((post) => ({
    postId: String(post._id),
    subject: post.subject || post.content.slice(0, 60),
    startsAt: new Date(post.event!.startsAt).toISOString(),
    location: post.event!.location ?? '',
    goingCount: post.event!.going?.length ?? 0,
  }));

  return { celebrations: celebrations.slice(0, 12), topKudos, trending, upcomingEvents, myBirthday };
}

/** Shares (or stops sharing) the viewer's birthday with colleagues. Day and month only. */
export async function setMyBirthday(viewer: Viewer, input: { month?: unknown; day?: unknown } | null): Promise<void> {
  if (!input || input.month == null) {
    await Employee.updateOne({ _id: viewer.id }, { $set: { birthday: null } });
    return;
  }
  const month = Number(input.month);
  const day = Number(input.day);
  const valid = Number.isInteger(month) && Number.isInteger(day) && month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(2024, month, 0)).getUTCDate();
  if (!valid) throw new CommunityError('Choose a real day and month.');
  await Employee.updateOne({ _id: viewer.id }, { $set: { birthday: { month, day } } });
}
