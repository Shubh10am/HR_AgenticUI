'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Award, BadgeCheck, Bookmark, Eye, BookmarkCheck, CalendarDays, Check, Link2, MapPin, MessageCircle, MoreHorizontal, Pin, PinOff, Trash2, Trophy, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { POST_KIND_META, REACTIONS, type FeedPerson, type FeedPost } from '@/lib/community';
import { cn } from '@/lib/utils';
import type { Community } from '../use-community';
import AuthorAvatar from './author-avatar';
import CommentThread from './comment-thread';
import RichText from './rich-text';

interface Props {
  post: FeedPost;
  me: FeedPerson;
  canPin: boolean;
  canModerate: boolean;
  community: Community;
  onTag: (tag: string) => void;
}

function PollBody({ post, onVote }: { post: FeedPost; onVote: (optionId: string) => void }) {
  const poll = post.poll!;
  const showResults = poll.myVote !== null || poll.closed;
  return (
    <div className="space-y-2">
      {poll.options.map((option) => {
        const share = poll.totalVotes ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
        const mine = poll.myVote === option.id;
        return (
          <button
            key={option.id}
            id={`community-post-${post.id}-vote-${option.id}`}
            type="button"
            disabled={poll.closed}
            onClick={() => onVote(option.id)}
            className={cn(
              'relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm transition-colors',
              mine ? 'border-primary' : 'hover:border-primary/50',
              poll.closed && 'cursor-default'
            )}
          >
            {showResults && <span aria-hidden className={cn('absolute inset-y-0 left-0 transition-all duration-500', mine ? 'bg-primary/15' : 'bg-muted')} style={{ width: `${share}%` }} />}
            <span className="relative flex items-center gap-2 font-medium">
              {mine && <Check className="h-4 w-4 text-primary" />} {option.label}
            </span>
            {showResults && <span className="relative text-xs font-semibold text-muted-foreground">{share}%</span>}
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} ·{' '}
        {poll.closed ? 'Poll closed' : poll.closesAt ? `Closes ${formatDistanceToNow(new Date(poll.closesAt), { addSuffix: true })}` : 'Open'}
        {!showResults && ' · Vote to see results'}
      </p>
    </div>
  );
}

function EventBody({ post, onRsvp }: { post: FeedPost; onRsvp: () => void }) {
  const event = post.event!;
  const startsAt = new Date(event.startsAt);
  const past = startsAt.getTime() < Date.now();
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-gradient-to-br from-emerald-50 to-transparent p-4 dark:from-emerald-500/10">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-background text-center shadow-sm">
        <span className="text-[11px] font-semibold uppercase text-emerald-600">{format(startsAt, 'MMM')}</span>
        <span className="text-2xl font-bold leading-none">{format(startsAt, 'd')}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="h-4 w-4" /> {format(startsAt, 'EEEE, d MMMM · p')}
        </p>
        {event.location && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" /> {event.location}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" /> {event.goingCount} going
        </p>
      </div>
      {!past && (
        <Button id={`community-post-${post.id}-rsvp`} variant={event.going ? 'secondary' : 'default'} className="rounded-full" onClick={onRsvp}>
          {event.going ? (
            <>
              <Check /> Going
            </>
          ) : (
            "I'm going"
          )}
        </Button>
      )}
    </div>
  );
}

/** One post in the feed. */
export default function PostCard({ post, me, canPin, canModerate, community, onTag }: Props) {
  const [showComments, setShowComments] = useState(post.comments.length > 0 && post.comments.length <= 2);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = POST_KIND_META[post.kind];
  const totalReactions = Object.values(post.reactions).reduce((total, count) => total + count, 0);
  const topReactions = REACTIONS.filter((reaction) => post.reactions[reaction.key] > 0).sort((a, b) => post.reactions[b.key] - post.reactions[a.key]).slice(0, 3);
  const mine = REACTIONS.find((reaction) => reaction.key === post.myReaction);

  const copyLink = async () => {
    await navigator.clipboard?.writeText(`${window.location.origin}/community#post-${post.id}`).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card id={`post-${post.id}`} className={cn('overflow-hidden scroll-mt-24 transition-shadow hover:shadow-md', post.pinned && 'ring-1 ring-primary/30')}>
      {post.kind === 'kudos' && post.kudos && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-100 via-amber-50 to-transparent px-5 py-3 dark:from-amber-500/20 dark:via-amber-500/5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-white shadow">
            <Award className="h-5 w-5" />
          </span>
          <div className="text-sm">
            <span className="font-semibold">{post.author?.name}</span> gave kudos to <span className="font-semibold">{post.kudos.recipient?.name ?? 'a former colleague'}</span>
            <Badge variant="outline" className="ml-2 border-amber-400 text-amber-800 dark:text-amber-200">
              {post.kudos.value}
            </Badge>
          </div>
        </div>
      )}
      {post.kind === 'achievement' && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-rose-100 via-rose-50 to-transparent px-5 py-3 dark:from-rose-500/20 dark:via-rose-500/5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow">
            <Trophy className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">{post.author?.name} shared an achievement</p>
        </div>
      )}
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <AuthorAvatar person={post.author} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{post.author?.name ?? 'Anonymous colleague'}</span>
              {post.mine && post.anonymous && <span className="text-xs text-muted-foreground">(you)</span>}
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.tone)}>{post.kind === 'update' ? post.topic : meta.label}</span>
              {post.pinned && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {post.author?.department ? `${post.author.department} · ` : ''}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id={`community-post-${post.id}-menu`} variant="ghost" size="icon" aria-label="Post options">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem id={`community-post-${post.id}-save`} onClick={() => void community.save(post.id)}>
                {post.saved ? <BookmarkCheck /> : <Bookmark />} {post.saved ? 'Remove from saved' : 'Save post'}
              </DropdownMenuItem>
              <DropdownMenuItem id={`community-post-${post.id}-copy-link`} onClick={() => void copyLink()}>
                <Link2 /> Copy link
              </DropdownMenuItem>
              {canPin && (
                <DropdownMenuItem id={`community-post-${post.id}-pin`} onClick={() => void community.pin(post.id, !post.pinned)}>
                  {post.pinned ? <PinOff /> : <Pin />} {post.pinned ? 'Unpin' : 'Pin to top'}
                </DropdownMenuItem>
              )}
              {(post.mine || canModerate) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem id={`community-post-${post.id}-delete`} className="text-destructive focus:text-destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 /> Delete post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {post.subject && <h3 className="font-display text-lg font-bold leading-snug">{post.subject}</h3>}
        {post.content && post.content !== post.subject && <RichText text={post.content} onTag={onTag} />}
        {post.poll && <PollBody post={post} onVote={(optionId) => void community.vote(post.id, optionId)} />}
        {post.event && <EventBody post={post} onRsvp={() => void community.rsvp(post.id)} />}
        {post.receipt && (
          <div id={`community-post-${post.id}-receipt`} className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Eye className="h-4 w-4" /> Read by {post.receipt.readCount} of {post.receipt.audience}</span>
            {post.receipt.read ? (
              <span className="ml-auto flex items-center gap-1.5 font-medium text-primary"><BadgeCheck className="h-4 w-4" /> {post.mine ? 'Your announcement' : 'You’ve read this'}</span>
            ) : (
              <Button id={`community-post-${post.id}-mark-read`} size="sm" className="ml-auto" onClick={() => void community.markRead(post.id)}><Check /> Mark as read</Button>
            )}
          </div>
        )}

        {(totalReactions > 0 || post.comments.length > 0) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {topReactions.length > 0 && <span className="flex -space-x-1 text-base">{topReactions.map((reaction) => <span key={reaction.key}>{reaction.emoji}</span>)}</span>}
              {totalReactions > 0 && totalReactions}
            </span>
            {post.comments.length > 0 && (
              <button type="button" className="hover:underline" onClick={() => setShowComments(!showComments)}>
                {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 border-t pt-2">
          <div className="group relative">
            <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 flex translate-y-1 gap-1 rounded-full border bg-popover p-1.5 opacity-0 shadow-lg transition-all group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.key}
                  id={`community-post-${post.id}-react-${reaction.key}`}
                  type="button"
                  title={reaction.label}
                  aria-label={reaction.label}
                  onClick={() => void community.react(post.id, reaction.key)}
                  className={cn('rounded-full p-1 text-xl transition-transform hover:-translate-y-1 hover:scale-125', post.myReaction === reaction.key && 'bg-primary/10')}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
            <Button
              id={`community-post-${post.id}-react`}
              variant="ghost"
              size="sm"
              className={cn('gap-1.5', mine && 'font-semibold text-primary')}
              onClick={() => void community.react(post.id, post.myReaction ?? 'like')}
            >
              <span className="text-base leading-none">{mine?.emoji ?? '👍'}</span> {mine?.label ?? 'React'}
            </Button>
          </div>
          <Button id={`community-post-${post.id}-comments-toggle`} variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowComments(!showComments)}>
            <MessageCircle /> Comment
          </Button>
          <Button id={`community-post-${post.id}-share`} variant="ghost" size="sm" className="gap-1.5" onClick={() => void copyLink()}>
            {copied ? <Check /> : <Link2 />} {copied ? 'Copied' : 'Share'}
          </Button>
          <Button
            id={`community-post-${post.id}-bookmark`}
            variant="ghost"
            size="icon"
            className={cn('ml-auto', post.saved && 'text-primary')}
            aria-label={post.saved ? 'Remove from saved' : 'Save post'}
            onClick={() => void community.save(post.id)}
          >
            {post.saved ? <BookmarkCheck /> : <Bookmark />}
          </Button>
        </div>

        {showComments && (
          <CommentThread
            postId={post.id}
            comments={post.comments}
            me={me}
            canModerate={canModerate}
            onComment={(content, parentId) => community.comment(post.id, content, parentId)}
            onEdit={(commentId, content) => community.editComment(post.id, commentId, content)}
            onDelete={(commentId) => community.deleteComment(post.id, commentId)}
          />
        )}
      </CardContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>The post, its comments and reactions are removed for everyone. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction id={`community-post-${post.id}-delete-confirm`} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void community.remove(post.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
