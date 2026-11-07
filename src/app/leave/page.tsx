'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarPlus, Loader2, Plus, Trash2, Undo2 } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatusPill, { type PillTone } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgApi } from '@/hooks/use-org-api';
import { storedDateOf } from '@/lib/attendance';
import type { AwayEntry, HolidayView, LeaveOverview, LeaveRequestView, LeaveTypePolicy } from '@/lib/leave';
import RequestLeaveDialog from './components/request-leave-dialog';
import TeamCalendar from './components/team-calendar';
import LeavePolicyEditor from './components/policy-editor';

const TONE: Record<LeaveRequestView['status'], PillTone> = { Pending: 'warn', Approved: 'ok', Rejected: 'bad', Cancelled: 'neutral' };
const show = (day: string) => format(storedDateOf(day), 'EEE d MMM yyyy');

export default function LeavePage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [overview, setOverview] = useState<LeaveOverview | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [holiday, setHoliday] = useState({ date: '', name: '', optional: false });

  const load = useCallback(async () => {
    if (isGuest) return setOverview({ year: new Date().getFullYear(), balances: [], requests: [], holidays: [], policy: [] });
    setOverview(await run<LeaveOverview>('/api/leave'));
  }, [isGuest, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const loadMonth = useCallback((month: string) => (isGuest ? Promise.resolve([]) : run<AwayEntry[]>(`/api/leave/calendar?month=${month}`)), [isGuest, run]);
  const upcoming = (overview?.holidays ?? []).filter((item) => item.date >= new Date().toISOString().slice(0, 10));

  return (
    <>
      <PageHeader title="Leave" description="Your balances, requests and the holiday calendar.">
        <Button id="leave-request" onClick={() => setRequesting(true)} disabled={isGuest || !overview?.balances.length}><CalendarPlus /> Request leave</Button>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="leave" />}
      {!overview ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overview.balances.filter((balance) => balance.tracked).map((balance) => (
              <Card key={balance.type} id={`leave-balance-${balance.type}`} className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{balance.type} leave</p>
                <p className="font-display text-2xl font-bold">{balance.available}<span className="text-sm font-normal text-muted-foreground"> days left</span></p>
                <p className="text-xs text-muted-foreground">
                  {balance.entitled} earned{balance.carriedForward ? ` + ${balance.carriedForward} carried` : ''} · {balance.used} taken{balance.pending ? ` · ${balance.pending} pending` : ''}
                </p>
              </Card>
            ))}
            {upcoming[0] && (
              <Card className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Next holiday</p>
                <p className="font-semibold">{upcoming[0].name}</p>
                <p className="text-xs text-muted-foreground">{show(upcoming[0].date)}</p>
              </Card>
            )}
          </div>
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger id="leave-tab-mine" value="mine">My requests</TabsTrigger>
              <TabsTrigger id="leave-tab-calendar" value="calendar">Who&apos;s away</TabsTrigger>
              <TabsTrigger id="leave-tab-holidays" value="holidays">Holidays {overview.year}</TabsTrigger>
              {isPeopleTeam && <TabsTrigger id="leave-tab-policy" value="policy">Policy</TabsTrigger>}
            </TabsList>
            <TabsContent value="mine" className="mt-4 space-y-3">
              {overview.requests.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No leave requests yet.</Card>}
              {overview.requests.map((request) => (
                <Card key={request.id} id={`leave-request-${request.id}`}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{request.type} leave · {request.days} day{request.days === 1 ? '' : 's'}</p>
                      <p className="text-xs text-muted-foreground">{request.startDate === request.endDate ? show(request.startDate) : `${show(request.startDate)} – ${show(request.endDate)}`}</p>
                      {request.approvalSteps.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {request.approvalSteps.map((step) => `${step.label}: ${step.status}${step.comment ? ` (“${step.comment}”)` : ''}`).join(' → ')}
                        </p>
                      )}
                    </div>
                    <StatusPill tone={TONE[request.status]}>{request.status}</StatusPill>
                    {(request.status === 'Pending' || (request.status === 'Approved' && request.startDate > new Date().toISOString().slice(0, 10))) && (
                      <Button id={`leave-request-${request.id}-withdraw`} size="sm" variant="ghost" onClick={async () => { const next = await run<LeaveOverview>(`/api/leave/${request.id}`, 'DELETE', undefined, 'Leave withdrawn'); if (next) setOverview(next); }}>
                        <Undo2 /> Withdraw
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="calendar" className="mt-4">
              <TeamCalendar load={loadMonth} holidays={overview.holidays} />
            </TabsContent>
            <TabsContent value="holidays" className="mt-4 space-y-4">
              {isPeopleTeam && (
                <Card className="flex flex-wrap items-end gap-3 p-4">
                  <div className="space-y-1.5"><Label htmlFor="holiday-date">Date</Label><Input id="holiday-date" type="date" value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} /></div>
                  <div className="min-w-[200px] flex-1 space-y-1.5"><Label htmlFor="holiday-name">Name</Label><Input id="holiday-name" value={holiday.name} maxLength={80} onChange={(e) => setHoliday({ ...holiday, name: e.target.value })} /></div>
                  <div className="flex items-center gap-2 pb-2"><Switch id="holiday-optional" checked={holiday.optional} onCheckedChange={(optional) => setHoliday({ ...holiday, optional })} /><Label htmlFor="holiday-optional">Optional</Label></div>
                  <Button
                    id="holiday-add"
                    disabled={!holiday.date || !holiday.name.trim()}
                    onClick={async () => {
                      const next = await run<HolidayView[]>('/api/leave/holidays', 'POST', holiday, 'Holiday added');
                      if (next) {
                        setHoliday({ date: '', name: '', optional: false });
                        await load();
                      }
                    }}
                  >
                    <Plus /> Add
                  </Button>
                </Card>
              )}
              {overview.holidays.length === 0 ? (
                <Card className="p-10 text-center text-sm text-muted-foreground">No holidays set for {overview.year}.</Card>
              ) : (
                <Card className="divide-y">
                  {overview.holidays.map((item) => (
                    <div key={item.id} id={`holiday-${item.id}`} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-40 text-sm text-muted-foreground">{show(item.date)}</span>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.optional && <StatusPill tone="neutral">Optional</StatusPill>}
                      {isPeopleTeam && (
                        <Button id={`holiday-${item.id}-remove`} variant="ghost" size="icon" aria-label={`Remove ${item.name}`} onClick={async () => { if (await run(`/api/leave/holidays?id=${item.id}`, 'DELETE', undefined, 'Holiday removed')) await load(); }}>
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </TabsContent>
            {isPeopleTeam && (
              <TabsContent value="policy" className="mt-4">
                <LeavePolicyEditor initial={overview.policy} onSave={async (types: LeaveTypePolicy[]) => { const ok = await run('/api/leave/policy', 'PUT', { types }, 'Leave policy saved'); if (ok) await load(); return !!ok; }} />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      <RequestLeaveDialog
        open={requesting}
        onOpenChange={setRequesting}
        balances={overview?.balances ?? []}
        holidays={overview?.holidays ?? []}
        onSubmit={async (input) => { const ok = await run('/api/leave', 'POST', input, 'Leave requested'); if (ok) await load(); return !!ok; }}
      />
    </>
  );
}
