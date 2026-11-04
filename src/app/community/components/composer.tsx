'use client';

import { useState, type FormEvent } from 'react';
import { Award, BarChart3, CalendarDays, Loader2, Megaphone, MessageSquareText, Plus, Sparkles, Trophy, VenetianMask, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KUDOS_VALUES, POST_KIND_META, type FeedPerson, type NewPostInput, type PostKind } from '@/lib/community';
import { cn } from '@/lib/utils';
import AuthorAvatar from './author-avatar';

const KIND_ICON: Record<PostKind, typeof Award> = {
  update: MessageSquareText,
  announcement: Megaphone,
  kudos: Award,
  poll: BarChart3,
  event: CalendarDays,
  achievement: Trophy,
};
const UPDATE_TOPICS = ['General', 'Question', 'Idea', 'Feedback'];
const PLACEHOLDER: Record<PostKind, string> = {
  update: 'Share an update, ask a question or start a discussion… use #tags',
  announcement: 'What does everyone need to know?',
  kudos: 'What did they do that made a difference?',
  poll: 'Add some context (optional)',
  event: 'What is happening and who should come?',
  achievement: 'Tell your colleagues about it — a certification, a milestone, a personal win…',
};

interface Props {
  me: FeedPerson;
  canAnnounce: boolean;
  people: FeedPerson[];
  onPublish: (input: NewPostInput) => Promise<boolean>;
}

/** The "start a post" card, with a form per post type. */
export default function Composer({ me, canAnnounce, people, onPublish }: Props) {
  const [kind, setKind] = useState<PostKind>('update');
  const [topic, setTopic] = useState('General');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [value, setValue] = useState<string>(KUDOS_VALUES[0]);
  const [options, setOptions] = useState(['', '']);
  const [closesInDays, setClosesInDays] = useState('3');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  const kinds = (Object.keys(POST_KIND_META) as PostKind[]).filter((candidate) => canAnnounce || !POST_KIND_META[candidate].staffOnly);
  const colleagues = people.filter((person) => person.id !== me.id);

  const reset = () => {
    setSubject('');
    setContent('');
    setAnonymous(false);
    setRecipientId('');
    setOptions(['', '']);
    setStartsAt('');
    setLocation('');
  };

  const ready =
    kind === 'poll'
      ? subject.trim() && options.filter((option) => option.trim()).length >= 2
      : kind === 'event'
        ? subject.trim() && startsAt && content.trim()
        : kind === 'kudos'
          ? recipientId && content.trim()
          : content.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || busy) return;
    const input: NewPostInput = { kind, subject, content: content.trim() || subject, topic: kind === 'update' ? topic : undefined };
    if (kind === 'update') input.anonymous = anonymous;
    if (kind === 'kudos') input.kudos = { recipientId, value };
    if (kind === 'poll') input.poll = { options: options.filter((option) => option.trim()), closesInDays: Number(closesInDays) };
    if (kind === 'event') input.event = { startsAt: new Date(startsAt).toISOString(), location };
    setBusy(true);
    const ok = await onPublish(input);
    setBusy(false);
    if (ok) reset();
  };

  return (
    <Card id="community-composer" className="overflow-hidden">
      <div className="flex gap-1 overflow-x-auto border-b bg-muted/30 px-3 pt-3" role="tablist" aria-label="Post type">
        {kinds.map((candidate) => {
          const Icon = KIND_ICON[candidate];
          return (
            <button
              key={candidate}
              id={`community-composer-kind-${candidate}`}
              type="button"
              role="tab"
              aria-selected={kind === candidate}
              onClick={() => setKind(candidate)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                kind === candidate ? 'border-primary bg-background text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" /> {POST_KIND_META[candidate].label}
            </button>
          );
        })}
      </div>
      <CardContent className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <AuthorAvatar person={anonymous && kind === 'update' ? null : me} />
            <div className="min-w-0 flex-1 space-y-3">
              {kind === 'kudos' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger id="community-kudos-recipient" aria-label="Who is the kudos for?">
                      <SelectValue placeholder="Who is it for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleagues.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                          {person.department ? ` · ${person.department}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1.5">
                    {KUDOS_VALUES.map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        id={`community-kudos-value-${candidate.toLowerCase().replaceAll(' ', '-')}`}
                        onClick={() => setValue(candidate)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                          value === candidate ? 'border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200' : 'text-muted-foreground hover:border-foreground/30'
                        )}
                      >
                        {candidate}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {kind !== 'kudos' && (
                <Input
                  id="community-composer-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={140}
                  placeholder={kind === 'poll' ? 'Ask a question…' : kind === 'event' ? 'Event name' : 'Title (optional)'}
                  className="border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
                />
              )}

              {kind === 'poll' && (
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        id={`community-poll-option-${index}`}
                        value={option}
                        maxLength={80}
                        placeholder={`Option ${index + 1}`}
                        onChange={(event) => setOptions(options.map((current, i) => (i === index ? event.target.value : current)))}
                      />
                      {options.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove option ${index + 1}`} onClick={() => setOptions(options.filter((_, i) => i !== index))}>
                          <X />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-3">
                    {options.length < 6 && (
                      <Button id="community-poll-add-option" type="button" variant="outline" size="sm" onClick={() => setOptions([...options, ''])}>
                        <Plus /> Add option
                      </Button>
                    )}
                    <Select value={closesInDays} onValueChange={setClosesInDays}>
                      <SelectTrigger id="community-poll-duration" className="h-9 w-40" aria-label="Poll duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['1', '3', '7', '14'].map((days) => (
                          <SelectItem key={days} value={days}>
                            Closes in {days} {days === '1' ? 'day' : 'days'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {kind === 'event' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input id="community-event-starts" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} aria-label="Starts at" />
                  <Input id="community-event-location" value={location} maxLength={120} onChange={(event) => setLocation(event.target.value)} placeholder="Where? (room, city or link)" />
                </div>
              )}

              <Textarea
                id="community-composer-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={4000}
                rows={3}
                placeholder={PLACEHOLDER[kind]}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex flex-wrap items-center gap-3">
              {kind === 'update' && (
                <>
                  <div className="flex gap-1">
                    {UPDATE_TOPICS.map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        id={`community-topic-${candidate.toLowerCase()}`}
                        onClick={() => setTopic(candidate)}
                        className={cn('rounded-full px-2.5 py-1 text-xs font-medium', topic === candidate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
                      >
                        {candidate}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="community-composer-anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
                    <Label htmlFor="community-composer-anonymous" className="flex cursor-pointer items-center gap-1 text-sm font-normal text-muted-foreground">
                      <VenetianMask className="h-4 w-4" /> Post anonymously
                    </Label>
                  </div>
                </>
              )}
              {kind === 'achievement' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Share only what you&apos;re happy for the whole organisation to see.
                </span>
              )}
            </div>
            <Button id="community-composer-submit" type="submit" disabled={!ready || busy} className="rounded-full px-6">
              {busy && <Loader2 className="animate-spin" />} Post
            </Button>
          </div>
          {anonymous && kind === 'update' && (
            <p id="community-composer-anonymous-note" className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Your name won&apos;t be shown to anyone — colleagues, HR or admins — and the audit log records this post as &ldquo;Anonymous colleague&rdquo;. You can still delete it
              yourself. Keep it respectful: the community guidelines still apply.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
