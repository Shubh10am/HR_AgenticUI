'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DoorOpen, Loader2, LogOut, UserMinus, Users } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatTile from '@/components/stat-tile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgApi } from '@/hooks/use-org-api';
import type { OffboardingView } from '@/lib/offboarding';
import ExitCase from './components/exit-case';
import StartExitDialog, { type StartExitInput } from './components/start-exit-dialog';

const OPEN = new Set(['pending-approval', 'in-progress']);

export default function OffboardingPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [cases, setCases] = useState<OffboardingView[] | null>(null);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [dialog, setDialog] = useState<'self' | 'other' | null>(null);

  const load = useCallback(async () => {
    if (isGuest) return setCases([]);
    const [next, org] = await Promise.all([
      run<OffboardingView[]>('/api/offboarding'),
      isPeopleTeam ? run<{ people: { id: string; name: string }[] }>('/api/hierarchy') : Promise.resolve(null),
    ]);
    setCases(next ?? []);
    if (org) setPeople(org.people.map(({ id, name }) => ({ id, name })));
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const mine = useMemo(() => (cases ?? []).filter((item) => item.mine), [cases]);
  const others = useMemo(() => (cases ?? []).filter((item) => !item.mine), [cases]);
  const myOpen = mine.find((item) => OPEN.has(item.status));

  const replace = (next: OffboardingView | null) => next && setCases((current) => (current ?? []).map((item) => (item.id === next.id ? next : item)));

  const start = async (input: StartExitInput) => {
    const result = await run('/api/offboarding', 'POST', input, input.employeeId ? 'Exit started' : 'Resignation submitted');
    if (result) await load();
    return !!result;
  };

  const caseProps = (item: OffboardingView) => ({
    item,
    canWithdraw: item.mine || isPeopleTeam,
    onTick: async (key: string, done: boolean) => replace(await run<OffboardingView>(`/api/offboarding/${item.id}`, 'PATCH', { key, done })),
    onWithdraw: async () => replace(await run<OffboardingView>(`/api/offboarding/${item.id}`, 'DELETE', undefined, item.mine ? 'Resignation withdrawn' : 'Exit cancelled')),
    onExitInterview: async (answers: Record<string, string>) => {
      const next = await run<OffboardingView>(`/api/offboarding/${item.id}/exit-interview`, 'POST', { answers }, 'Thanks for your feedback');
      replace(next);
      return !!next;
    },
  });

  return (
    <>
      <PageHeader title="Offboarding" description="Resignations, exit checklists and exit feedback — so leaving is as well run as joining.">
        <div className="flex gap-2">
          {isPeopleTeam && (
            <Button id="exit-start-other" variant="outline" onClick={() => setDialog('other')} disabled={isGuest}>
              <UserMinus /> Start an exit
            </Button>
          )}
          {!myOpen && (
            <Button id="exit-start-self" variant="ghost" onClick={() => setDialog('self')} disabled={isGuest}>
              <LogOut /> Resign
            </Button>
          )}
        </div>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="offboarding" />}

      {!cases ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…
        </div>
      ) : (
        <>
          {others.length > 0 && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatTile id="exit-stat-pending" icon={DoorOpen} label="Awaiting approval" value={others.filter((item) => item.status === 'pending-approval').length} />
              <StatTile id="exit-stat-active" icon={Users} label="Exits in progress" value={others.filter((item) => item.status === 'in-progress').length} />
              <StatTile
                id="exit-stat-month"
                icon={LogOut}
                label="Leaving in the next 30 days"
                value={others.filter((item) => OPEN.has(item.status) && new Date(item.lastWorkingDay).getTime() - Date.now() < 30 * 86_400_000).length}
              />
            </div>
          )}
          <Tabs defaultValue={others.length > 0 ? 'team' : 'mine'}>
            <TabsList>
              {others.length > 0 && <TabsTrigger id="exit-tab-team" value="team">{isPeopleTeam ? 'All exits' : 'My team'}</TabsTrigger>}
              <TabsTrigger id="exit-tab-mine" value="mine">My exit</TabsTrigger>
            </TabsList>
            {others.length > 0 && (
              <TabsContent value="team" className="mt-4 space-y-4">
                {others.filter((item) => OPEN.has(item.status)).map((item) => <ExitCase key={item.id} {...caseProps(item)} />)}
                {others.some((item) => !OPEN.has(item.status)) && <h3 className="pt-2 text-sm font-semibold text-muted-foreground">Closed</h3>}
                {others.filter((item) => !OPEN.has(item.status)).map((item) => <ExitCase key={item.id} {...caseProps(item)} />)}
              </TabsContent>
            )}
            <TabsContent value="mine" className="mt-4 space-y-4">
              {mine.length === 0 ? (
                <Card className="p-10 text-center text-sm text-muted-foreground">You have no resignation on file. If you decide to move on, you can submit it here and track every step.</Card>
              ) : (
                mine.map((item) => <ExitCase key={item.id} {...caseProps(item)} />)
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      <StartExitDialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)} people={dialog === 'other' ? people : null} onSubmit={start} />
    </>
  );
}
