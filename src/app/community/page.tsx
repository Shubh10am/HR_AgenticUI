'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Hash, Loader2, MessagesSquare, RefreshCw, Search, X } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { hashtagsOf, isStaff, type FeedPerson, type FeedPost } from '@/lib/community';
import { cn } from '@/lib/utils';
import { useCommunity } from './use-community';
import Composer from './components/composer';
import PostCard from './components/post-card';
import CommunitySidebar from './components/community-sidebar';

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'announcement', label: 'Announcements', match: (post: FeedPost) => post.kind === 'announcement' },
  { key: 'kudos', label: 'Kudos', match: (post: FeedPost) => post.kind === 'kudos' },
  { key: 'poll', label: 'Polls', match: (post: FeedPost) => post.kind === 'poll' },
  { key: 'event', label: 'Events', match: (post: FeedPost) => post.kind === 'event' },
  { key: 'achievement', label: 'Achievements', match: (post: FeedPost) => post.kind === 'achievement' },
  { key: 'anonymous', label: 'Anonymous', match: (post: FeedPost) => post.anonymous },
  { key: 'saved', label: 'Saved', match: (post: FeedPost) => post.saved },
  { key: 'mine', label: 'My posts', match: (post: FeedPost) => post.mine },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

const searchableText = (post: FeedPost) =>
  [post.subject, post.content, post.topic, post.author?.name, post.kudos?.recipient?.name, post.kudos?.value, ...post.comments.map((comment) => comment.content)].join(' ').toLowerCase();

export default function CommunityPage() {
  const { user } = useAuth();
  const community = useCommunity();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const me: FeedPerson = { id: user?.id ?? 'guest', name: user?.name ?? 'You', department: '' };
  const staff = isStaff(user?.role);
  const canModerate = ['Admin', 'HR', 'SuperAdmin'].includes(user?.role ?? '');

  const visible = useMemo(() => {
    const match = FILTERS.find((candidate) => candidate.key === filter)!.match;
    const needle = query.trim().toLowerCase();
    return community.posts.filter(
      (post) => match(post) && (!needle || searchableText(post).includes(needle)) && (!tag || hashtagsOf(`${post.subject} ${post.content}`).includes(tag))
    );
  }, [community.posts, filter, query, tag]);

  // Opening a shared link scrolls to that post once the feed has loaded.
  useEffect(() => {
    if (community.isLoading || !window.location.hash.startsWith('#post-')) return;
    document.querySelector(window.location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [community.isLoading]);

  const chooseTag = (next: string | null) => {
    setTag(next);
    if (next) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageHeader title="Community Hub" description="Share wins, recognise colleagues, ask questions and keep up with what's happening across the organisation.">
        <Button id="community-refresh" variant="outline" onClick={() => void community.reload()} disabled={community.isLoading}>
          <RefreshCw className={community.isLoading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </PageHeader>
      {community.isGuest && <GuestSampleNotice what="the community feed" />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Composer me={me} canAnnounce={staff} people={community.people} onPublish={community.publish} />

          <div className="sticky top-16 z-20 -mx-1 space-y-3 bg-background/85 px-1 py-2 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="community-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts, people and comments" className="rounded-full pl-9" />
              </div>
              {tag && (
                <button id="community-active-tag" type="button" onClick={() => setTag(null)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  <Hash className="h-3 w-3" /> {tag} <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter the feed">
              {FILTERS.map((candidate) => (
                <button
                  key={candidate.key}
                  id={`community-filter-${candidate.key}`}
                  type="button"
                  role="tab"
                  aria-selected={filter === candidate.key}
                  onClick={() => setFilter(candidate.key)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                    filter === candidate.key ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          </div>

          {community.isLoading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading the feed…
            </div>
          ) : community.error ? (
            <Card className="flex flex-col items-center gap-2 p-10 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="font-semibold">Couldn&apos;t load the community</p>
              <p className="text-sm text-muted-foreground">{community.error}</p>
              <Button variant="outline" onClick={() => void community.reload()}>
                <RefreshCw /> Try again
              </Button>
            </Card>
          ) : visible.length === 0 ? (
            <Card id="community-empty" className="flex flex-col items-center gap-2 p-10 text-center">
              <MessagesSquare className="h-9 w-9 text-muted-foreground" />
              <p className="font-semibold">{community.posts.length === 0 ? 'No posts yet' : 'Nothing matches'}</p>
              <p className="text-sm text-muted-foreground">
                {community.posts.length === 0 ? 'Start the conversation — share an update, give kudos or run a quick poll.' : 'Try another filter or clear the search.'}
              </p>
            </Card>
          ) : (
            visible.map((post) => <PostCard key={post.id} post={post} me={me} canPin={staff} canModerate={canModerate} community={community} onTag={chooseTag} />)
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CommunitySidebar highlights={community.highlights} activeTag={tag} onTag={chooseTag} onShareBirthday={community.shareBirthday} />
        </aside>
      </div>
    </>
  );
}
