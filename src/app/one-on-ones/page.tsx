'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, isFuture } from 'date-fns';
import { CalendarPlus, Loader2, MessagesSquare } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import PersonAvatar from '@/components/person-avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOrgApi } from '@/hooks/use-org-api';
import { cn } from '@/lib/utils';
import type { OneOnOneOverview, OneOnOneView } from '@/lib/one-on-ones';
import MeetingDetail from './components/meeting-detail';
import ScheduleDialog from './components/schedule-dialog';

export default function OneOnOnesPage() {
  const { run, isGuest, authLoading } = useOrgApi();
  const [data, setData] = useState<OneOnOneOverview | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    if (isGuest) return setData({ meetings: [], people: [] });
    setData(await run<OneOnOneOverview>('/api/one-on-ones'));
  }, [isGuest, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const { upcoming, past } = useMemo(() => {
    const meetings = data?.meetings ?? [];
    const next = meetings.filter((m) => m.status === 'scheduled' && isFuture(new Date(m.scheduledFor))).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
    return { upcoming: next, past: meetings.filter((m) => !next.includes(m)) };
  }, [data]);
  const active = data?.meetings.find((m) => m.id === selected) ?? upcoming[0] ?? past[0] ?? null;

  const change = async (op: string, input: Record<string, unknown> = {}, success?: string) => {
    if (!active) return;
    const next = await run<OneOnOneView>(`/api/one-on-ones/${active.id}`, 'PATCH', { op, ...input }, success);
    if (next) setData((current) => current && { ...current, meetings: current.meetings.map((m) => (m.id === next.id ? next : m)) });
  };

  const Row = ({ meeting }: { meeting: OneOnOneView }) => (
    <button
      id={`one-on-one-${meeting.id}-row`}
      type="button"
      onClick={() => setSelected(meeting.id)}
      className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60', active?.id === meeting.id && 'bg-primary/5')}
    >
      <PersonAvatar person={{ name: meeting.withPerson.name, department: '' }} className="h-9 w-9" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{meeting.withPerson.name}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(meeting.scheduledFor), 'EEE d MMM · h:mm a')}{meeting.status === 'cancelled' ? ' · cancelled' : ''}</p>
      </div>
      <span className="text-xs text-muted-foreground">{meeting.actions.filter((a) => !a.done).length || ''}</span>
    </button>
  );

  return (
    <>
      <PageHeader title="1:1s" description="Regular check-ins with your manager and your team: a shared agenda, notes and follow-ups.">
        <Button id="one-on-one-book" onClick={() => setBooking(true)} disabled={isGuest || !data?.people.length}><CalendarPlus /> Book a 1:1</Button>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="1:1s" />}
      {!data ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : data.meetings.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <MessagesSquare className="h-10 w-10 text-primary" />
          <p className="font-semibold">No 1:1s yet</p>
          <p className="max-w-md text-sm text-muted-foreground">{data.people.length ? 'Book your first check-in. Add topics to a shared agenda beforehand, and agree action items during the meeting.' : 'You need a manager or a direct report set in the Hierarchy to book a 1:1.'}</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit overflow-hidden">
            <p className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</p>
            {upcoming.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">Nothing booked.</p> : upcoming.map((m) => <Row key={m.id} meeting={m} />)}
            <p className="border-y px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past</p>
            {past.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">None yet.</p> : past.map((m) => <Row key={m.id} meeting={m} />)}
          </Card>
          {active && <MeetingDetail key={active.id} meeting={active} onChange={change} />}
        </div>
      )}
      <ScheduleDialog open={booking} people={data?.people ?? []} onOpenChange={setBooking} onSubmit={async (input) => { const created = await run<OneOnOneView>('/api/one-on-ones', 'POST', input, '1:1 booked'); if (created) { await load(); setSelected(created.id); } return !!created; }} />
    </>
  );
}
