'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ClipboardCheck, Loader2, Plus, Target } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusPill from '@/components/status-pill';
import { useOrgApi } from '@/hooks/use-org-api';
import type { CycleView, GoalStatus, GoalView, ReviewView } from '@/lib/performance';
import GoalCard from './components/goal-card';
import GoalDialog, { type GoalInput } from './components/goal-dialog';
import ReviewDialog from './components/review-dialog';
import CyclesPanel from './components/cycles-panel';

interface Person {
  id: string;
  name: string;
  managerId: string | null;
}

export default function PerformancePage() {
  const { run, isGuest, authLoading, isPeopleTeam, user } = useOrgApi();
  const [goals, setGoals] = useState<GoalView[] | null>(null);
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [cycles, setCycles] = useState<CycleView[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [editing, setEditing] = useState<GoalView | 'new' | null>(null);
  const [reading, setReading] = useState<ReviewView | null>(null);

  const load = useCallback(async () => {
    if (isGuest) return setGoals([]);
    const [nextGoals, nextReviews, nextCycles, org] = await Promise.all([
      run<GoalView[]>('/api/performance/goals'),
      run<ReviewView[]>('/api/performance/reviews'),
      isPeopleTeam ? run<CycleView[]>('/api/performance/cycles') : Promise.resolve([]),
      run<{ people: Person[] }>('/api/hierarchy'),
    ]);
    setGoals(nextGoals ?? []);
    setReviews(nextReviews ?? []);
    setCycles(nextCycles ?? []);
    setPeople(org?.people ?? []);
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const me = user?.id ?? '';
  const reportIds = useMemo(() => new Set(people.filter((person) => person.managerId === me).map((person) => person.id)), [people, me]);
  const myGoals = (goals ?? []).filter((goal) => goal.owner.id === me);
  const teamGoals = (goals ?? []).filter((goal) => reportIds.has(goal.owner.id));
  const owners = [{ id: me, name: 'Me' }, ...(isPeopleTeam ? people.filter((person) => person.id !== me) : people.filter((person) => reportIds.has(person.id)))];
  const toWrite = reviews.filter((review) => review.canWrite && review.status === 'pending');

  const saveGoal = async (input: GoalInput) => {
    const target = editing && editing !== 'new' ? editing : null;
    const result = target ? await run(`/api/performance/goals/${target.id}`, 'PATCH', input, 'Goal saved') : await run('/api/performance/goals', 'POST', input, 'Goal created');
    if (result) await load();
    return !!result;
  };
  const setStatus = async (goal: GoalView, status: GoalStatus) => {
    if (await run(`/api/performance/goals/${goal.id}`, 'PATCH', { status })) await load();
  };
  const removeGoal = async (goal: GoalView) => {
    if (window.confirm(`Delete "${goal.title}"? Goals that support it are kept.`) && (await run(`/api/performance/goals/${goal.id}`, 'DELETE', undefined, 'Goal deleted'))) await load();
  };

  const goalGrid = (list: GoalView[], empty: string) =>
    list.length === 0 ? (
      <Card className="p-10 text-center text-sm text-muted-foreground">{empty}</Card>
    ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((goal) => <GoalCard key={goal.id} goal={goal} onStatus={(status) => void setStatus(goal, status)} onEdit={() => setEditing(goal)} onDelete={() => void removeGoal(goal)} />)}
      </div>
    );

  return (
    <>
      <PageHeader title="Performance" description="Goals that connect across the organisation, and review cycles that people complete together.">
        <Button id="goal-new" onClick={() => setEditing('new')} disabled={isGuest}>
          <Plus /> New goal
        </Button>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="performance" />}

      {!goals ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…
        </div>
      ) : (
        <Tabs defaultValue={toWrite.length ? 'reviews' : 'goals'}>
          <TabsList>
            <TabsTrigger id="performance-tab-goals" value="goals"><Target className="mr-1.5 h-4 w-4" /> My goals</TabsTrigger>
            {reportIds.size > 0 && <TabsTrigger id="performance-tab-team" value="team">Team goals</TabsTrigger>}
            <TabsTrigger id="performance-tab-company" value="company">All goals</TabsTrigger>
            <TabsTrigger id="performance-tab-reviews" value="reviews">
              <ClipboardCheck className="mr-1.5 h-4 w-4" /> Reviews {toWrite.length > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{toWrite.length}</span>}
            </TabsTrigger>
            {isPeopleTeam && <TabsTrigger id="performance-tab-cycles" value="cycles">Review cycles</TabsTrigger>}
          </TabsList>
          <TabsContent value="goals" className="mt-4">{goalGrid(myGoals, 'No goals yet. Add one and link it to a team or company goal.')}</TabsContent>
          <TabsContent value="team" className="mt-4">{goalGrid(teamGoals, 'Your direct reports have no goals yet.')}</TabsContent>
          <TabsContent value="company" className="mt-4">{goalGrid(goals, 'No goals in the organisation yet.')}</TabsContent>
          <TabsContent value="reviews" className="mt-4 space-y-3">
            {reviews.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No reviews yet. They appear here when HR launches a review cycle.</Card>}
            {reviews.map((review) => (
              <Card key={review.id} id={`review-${review.id}`}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {review.type === 'self' ? (review.subject.id === me ? 'Your self review' : `${review.subject.name} · self review`) : review.subject.id === me ? `Manager review from ${review.reviewer?.name ?? 'your manager'}` : `Manager review of ${review.subject.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{review.cycle.name} · due {format(new Date(review.cycle.dueAt), 'd MMM yyyy')}</p>
                  </div>
                  <StatusPill tone={review.status === 'submitted' ? 'ok' : 'warn'}>{review.status === 'submitted' ? 'Submitted' : 'To do'}</StatusPill>
                  <Button id={`review-${review.id}-open`} size="sm" variant={review.canWrite && review.status === 'pending' ? 'default' : 'outline'} onClick={() => setReading(review)}>
                    {review.canWrite ? (review.status === 'pending' ? 'Write' : 'Edit') : 'Read'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          {isPeopleTeam && (
            <TabsContent value="cycles" className="mt-4">
              <CyclesPanel
                cycles={cycles}
                onCreate={async (name, dueAt) => {
                  const next = await run<CycleView[]>('/api/performance/cycles', 'POST', { name, dueAt }, 'Draft cycle created');
                  if (next) setCycles(next);
                  return !!next;
                }}
                onStatus={async (id, status) => {
                  const next = await run<CycleView[]>(`/api/performance/cycles/${id}`, 'PATCH', { status }, status === 'active' ? 'Cycle launched' : 'Cycle closed and shared');
                  if (next) {
                    setCycles(next);
                    await load();
                  }
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
      <GoalDialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} goal={editing && editing !== 'new' ? editing : null} goals={goals ?? []} owners={owners} onSubmit={saveGoal} />
      <ReviewDialog
        review={reading}
        onOpenChange={(open) => !open && setReading(null)}
        onSave={async (answers, submit) => {
          const next = await run<ReviewView>(`/api/performance/reviews/${reading!.id}`, 'PUT', { answers, submit }, submit ? 'Review submitted' : 'Draft saved');
          if (next) await load();
          return !!next;
        }}
      />
    </>
  );
}
