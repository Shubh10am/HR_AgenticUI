'use client';

import { useState } from 'react';
import { format, isToday } from 'date-fns';
import { Award, Cake, CalendarDays, Hash, PartyPopper, Sparkles, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Celebration, CommunityHighlights } from '@/lib/community';
import AuthorAvatar from './author-avatar';

const MONTHS = Array.from({ length: 12 }, (_, index) => format(new Date(2024, index, 1), 'MMMM'));
const CELEBRATION_META: Record<Celebration['kind'], { icon: typeof Cake; tone: string }> = {
  birthday: { icon: Cake, tone: 'text-pink-500' },
  anniversary: { icon: PartyPopper, tone: 'text-violet-500' },
  'new-joiner': { icon: UserPlus, tone: 'text-emerald-500' },
};

/** Day and month only, read as UTC so the date never shifts by a time zone. */
const dayOf = (iso: string) => {
  const date = new Date(iso);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

function describe(celebration: Celebration) {
  const day = dayOf(celebration.date);
  const when = isToday(day) ? 'today' : format(day, 'd MMM');
  if (celebration.kind === 'birthday') return `Birthday ${when}`;
  if (celebration.kind === 'anniversary') return `${celebration.years} ${celebration.years === 1 ? 'year' : 'years'} at the company · ${when}`;
  return `Joined ${format(day, 'd MMM')} · say hello!`;
}

function BirthdayDialog({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; initial: CommunityHighlights['myBirthday']; onSave: (value: { month: number; day: number } | null) => Promise<boolean> }) {
  const [month, setMonth] = useState(initial ? String(initial.month) : '');
  const [day, setDay] = useState(initial ? String(initial.day) : '');
  const days = month ? new Date(Date.UTC(2024, Number(month), 0)).getUTCDate() : 31;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Celebrate your birthday</DialogTitle>
          <DialogDescription>
            Optional. Colleagues see the day and month in Celebrations — never your year of birth or age. You can stop sharing at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Select value={month} onValueChange={(value) => { setMonth(value); if (Number(day) > new Date(Date.UTC(2024, Number(value), 0)).getUTCDate()) setDay(''); }}>
            <SelectTrigger id="community-birthday-month" aria-label="Month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, index) => (
                <SelectItem key={name} value={String(index + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger id="community-birthday-day" aria-label="Day">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: days }, (_, index) => (
                <SelectItem key={index} value={String(index + 1)}>
                  {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {initial ? (
            <Button id="community-birthday-stop" variant="ghost" onClick={async () => (await onSave(null)) && onOpenChange(false)}>
              Stop sharing
            </Button>
          ) : (
            <span />
          )}
          <Button id="community-birthday-save" disabled={!month || !day} onClick={async () => (await onSave({ month: Number(month), day: Number(day) })) && onOpenChange(false)}>
            Share with colleagues
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  highlights: CommunityHighlights | null;
  activeTag: string | null;
  onTag: (tag: string | null) => void;
  onShareBirthday: (value: { month: number; day: number } | null) => Promise<boolean>;
}

/** Celebrations, kudos leaders, trending tags and upcoming events. */
export default function CommunitySidebar({ highlights, activeTag, onTag, onShareBirthday }: Props) {
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  if (!highlights) return null;

  return (
    <div className="space-y-5">
      <Card id="community-celebrations">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" /> Celebrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {highlights.celebrations.length === 0 && <p className="text-sm text-muted-foreground">No birthdays, anniversaries or new joiners in the next 30 days.</p>}
          {highlights.celebrations.map((celebration) => {
            const { icon: Icon, tone } = CELEBRATION_META[celebration.kind];
            return (
              <div key={`${celebration.kind}-${celebration.person.id}`} id={`community-celebration-${celebration.kind}-${celebration.person.id}`} className="flex items-center gap-3">
                <div className="relative">
                  <AuthorAvatar person={celebration.person} className="h-9 w-9 text-xs" />
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5 shadow">
                    <Icon className={`h-3.5 w-3.5 ${tone}`} />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{celebration.person.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{describe(celebration)}</p>
                </div>
              </div>
            );
          })}
          <Button id="community-birthday-open" variant="outline" size="sm" className="w-full" onClick={() => setBirthdayOpen(true)}>
            <Cake /> {highlights.myBirthday ? `Your birthday: ${highlights.myBirthday.day} ${MONTHS[highlights.myBirthday.month - 1]}` : 'Share your birthday'}
          </Button>
        </CardContent>
      </Card>

      <Card id="community-upcoming-events">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-emerald-500" /> Upcoming events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {highlights.upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground">No events yet — create one from the Event tab.</p>}
          {highlights.upcomingEvents.map((event) => (
            <a key={event.postId} href={`#post-${event.postId}`} id={`community-event-link-${event.postId}`} className="flex items-center gap-3 rounded-lg p-1 -m-1 hover:bg-muted/60">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50 text-center dark:bg-emerald-500/10">
                <span className="text-[10px] font-semibold uppercase text-emerald-600">{format(new Date(event.startsAt), 'MMM')}</span>
                <span className="text-base font-bold leading-none">{format(new Date(event.startsAt), 'd')}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{event.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {format(new Date(event.startsAt), 'p')} · {event.goingCount} going
                </p>
              </div>
            </a>
          ))}
        </CardContent>
      </Card>

      <Card id="community-top-kudos">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-amber-500" /> Kudos this month
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {highlights.topKudos.length === 0 && <p className="text-sm text-muted-foreground">No kudos yet this month. Be the first to recognise someone!</p>}
          {highlights.topKudos.map((entry, index) => (
            <div key={entry.person.id} className="flex items-center gap-3">
              <span className="w-4 text-sm font-bold text-muted-foreground">{index + 1}</span>
              <AuthorAvatar person={entry.person} className="h-8 w-8 text-xs" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.person.name}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">{entry.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {highlights.trending.length > 0 && (
        <Card id="community-trending">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4 text-primary" /> Trending
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {highlights.trending.map((entry) => (
              <button
                key={entry.tag}
                id={`community-trending-${entry.tag}`}
                type="button"
                onClick={() => onTag(activeTag === entry.tag ? null : entry.tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${activeTag === entry.tag ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}
              >
                #{entry.tag} <span className="opacity-60">{entry.count}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {birthdayOpen && <BirthdayDialog open={birthdayOpen} onOpenChange={setBirthdayOpen} initial={highlights.myBirthday} onSave={onShareBirthday} />}
    </div>
  );
}
