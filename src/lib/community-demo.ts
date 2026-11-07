import { emptyReactions, type CommunityHighlights, type FeedComment, type FeedPerson, type FeedPost, type ReactionKey } from './community';

/** A fictional organisation's feed, so guests can see how the community works. */
const people: Record<string, FeedPerson> = {
  emma: { id: 'demo-emma', name: 'Emma Rossi', department: 'Human Resources' },
  oliver: { id: 'demo-oliver', name: 'Oliver Kim', department: 'Engineering' },
  ava: { id: 'demo-ava', name: 'Ava Thompson', department: 'Engineering' },
  noah: { id: 'demo-noah', name: 'Noah Patel', department: 'Product' },
  mia: { id: 'demo-mia', name: 'Mia Fernandes', department: 'Engineering' },
  william: { id: 'demo-william', name: 'William Osei', department: 'Product' },
  sophia: { id: 'demo-sophia', name: 'Sophia Haddad', department: 'Human Resources' },
};

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const ahead = (days: number, hour = 16) => {
  const date = new Date(Date.now() + days * 86_400_000);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};
const reactions = (values: Partial<ReturnType<typeof emptyReactions>>) => ({ ...emptyReactions(), ...values });
const base = { anonymous: false, mine: false, pinned: false, saved: false, myReaction: null as ReactionKey | null, comments: [] as FeedComment[] };

export function demoFeed(): FeedPost[] {
  return [
    {
      ...base,
      id: 'demo-1',
      kind: 'announcement',
      author: people.emma,
      pinned: true,
      topic: 'Announcement',
      subject: 'Hybrid work guidelines for Q1',
      content: 'We have refreshed the hybrid work guidelines: two anchor days per team, flexible hours around a 11:00–15:00 core. Read the full note in the knowledge base and drop questions below. #HybridWork #PeopleUpdates',
      reactions: reactions({ like: 18, insight: 6, support: 4 }),
      comments: [
        { id: 'demo-c1', author: people.oliver, content: 'Thanks @Emma — will the anchor days be set per team or per department?', parentId: null, createdAt: ago(20), mine: false },
        { id: 'demo-c2', author: people.emma, content: 'Per team. Managers will share theirs by Friday.', parentId: 'demo-c1', createdAt: ago(19), mine: false },
      ],
      createdAt: ago(26),
    },
    {
      ...base,
      id: 'demo-2',
      kind: 'kudos',
      author: people.oliver,
      topic: 'Kudos',
      subject: '',
      content: 'Huge thanks to Ava for staying with the release through the weekend and writing the rollback guide everyone used on Monday. #Release',
      kudos: { recipient: people.ava, value: 'Above and beyond' },
      reactions: reactions({ celebrate: 22, love: 9, like: 5 }),
      createdAt: ago(5),
    },
    {
      ...base,
      id: 'demo-3',
      kind: 'poll',
      author: people.sophia,
      topic: 'Poll',
      subject: 'What should our next team offsite be?',
      content: 'Voting closes in three days. #Offsite',
      poll: {
        options: [
          { id: 'o1', label: 'Hiking day', votes: 14 },
          { id: 'o2', label: 'Cooking class', votes: 21 },
          { id: 'o3', label: 'Volunteering', votes: 11 },
        ],
        myVote: null,
        totalVotes: 46,
        closesAt: ahead(3),
        closed: false,
      },
      reactions: reactions({ like: 7 }),
      createdAt: ago(9),
    },
    {
      ...base,
      id: 'demo-4',
      kind: 'event',
      author: people.noah,
      topic: 'Event',
      subject: 'Product demo day',
      content: 'Every squad shows what they shipped this quarter. Snacks provided! #DemoDay',
      event: { startsAt: ahead(4), location: 'Auditorium · 3rd floor', goingCount: 37, going: false },
      reactions: reactions({ celebrate: 11 }),
      createdAt: ago(30),
    },
    {
      ...base,
      id: 'demo-5',
      kind: 'update',
      author: null,
      anonymous: true,
      topic: 'Question',
      subject: 'Can we get quieter spaces for focus work?',
      content: 'The open floor gets loud in the afternoons. Would others use a couple of bookable quiet rooms? #Workplace',
      reactions: reactions({ like: 31, support: 12 }),
      comments: [{ id: 'demo-c3', author: people.emma, content: 'Great suggestion — facilities are looking at the 4th floor rooms. Will update here.', parentId: null, createdAt: ago(2), mine: false }],
      createdAt: ago(3),
    },
    {
      ...base,
      id: 'demo-6',
      kind: 'achievement',
      author: people.mia,
      topic: 'Achievement',
      subject: 'Passed my cloud security certification 🎓',
      content: 'Six weeks of evenings, but it paid off. Happy to share my study notes with anyone preparing. #Learning',
      reactions: reactions({ celebrate: 28, love: 6 }),
      createdAt: ago(50),
    },
  ];
}

export function demoHighlights(): CommunityHighlights {
  return {
    celebrations: [
      { person: people.william, kind: 'new-joiner', date: ago(72) },
      { person: people.sophia, kind: 'birthday', date: ahead(2, 0) },
      { person: people.oliver, kind: 'anniversary', date: ahead(6, 0), years: 3 },
      { person: people.noah, kind: 'anniversary', date: ahead(12, 0), years: 5 },
    ],
    topKudos: [
      { person: people.ava, count: 6 },
      { person: people.emma, count: 4 },
      { person: people.mia, count: 3 },
    ],
    trending: [
      { tag: 'release', count: 9 },
      { tag: 'hybridwork', count: 7 },
      { tag: 'demoday', count: 5 },
      { tag: 'learning', count: 4 },
      { tag: 'offsite', count: 3 },
    ],
    upcomingEvents: [{ postId: 'demo-4', subject: 'Product demo day', startsAt: ahead(4), location: 'Auditorium · 3rd floor', goingCount: 37 }],
    myBirthday: null,
  };
}
