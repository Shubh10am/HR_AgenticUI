'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Award, BookOpen, CheckCircle2, Clock, ExternalLink, GraduationCap, Loader2, Pencil, Plus, ShieldCheck, UserPlus } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatTile from '@/components/stat-tile';
import StatusPill, { type PillTone } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgApi } from '@/hooks/use-org-api';
import { ENROLLMENT_LABEL, type CourseView, type EnrollmentStatus, type EnrollmentView, type LearningOverview } from '@/lib/learning';
import { AssignDialog, CourseDialog } from './components/course-dialogs';

const TONE: Record<EnrollmentStatus, PillTone> = { assigned: 'neutral', 'in-progress': 'info', completed: 'ok' };

function CourseMeta({ course }: { course: CourseView }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>{course.category}</span>
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.durationMins} min</span>
      {course.mandatory && <span className="flex items-center gap-1 font-medium text-primary"><ShieldCheck className="h-3 w-3" /> Mandatory</span>}
    </p>
  );
}

export default function LearningPage() {
  const { run, isGuest, authLoading, isPeopleTeam, user } = useOrgApi();
  const [data, setData] = useState<LearningOverview | null>(null);
  const [people, setPeople] = useState<{ id: string; name: string; managerId?: string | null }[]>([]);
  const [editing, setEditing] = useState<{ course: CourseView | null } | null>(null);
  const [assigning, setAssigning] = useState<CourseView | null>(null);

  const load = useCallback(async () => {
    if (isGuest) return setData({ mine: [], catalogue: [], compliance: null });
    const [overview, org] = await Promise.all([run<LearningOverview>('/api/learning'), run<{ people: { id: string; name: string; managerId?: string | null }[] }>('/api/hierarchy')]);
    setData(overview);
    setPeople(org?.people ?? []);
  }, [isGuest, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const myId = user?.id;
  const assignable = isPeopleTeam ? people.filter((p) => p.id !== myId) : people.filter((p) => p.managerId === myId);
  const canAssign = isPeopleTeam || assignable.length > 0;
  const mine = data?.mine ?? [];
  const done = mine.filter((e) => e.status === 'completed');
  const overdue = mine.filter((e) => e.overdue);
  const enrolled = new Set(mine.map((e) => e.course.id));
  const act = async (enrollment: EnrollmentView, action: 'start' | 'complete') => {
    const next = await run<LearningOverview>(`/api/learning/${enrollment.id}`, 'PATCH', { action }, action === 'complete' ? 'Course completed — certificate issued' : 'Course started');
    if (next) setData(next);
  };

  return (
    <>
      <PageHeader title="Learning" description="Your courses, mandatory training and certificates.">
        {isPeopleTeam && <Button id="learning-add-course" onClick={() => setEditing({ course: null })} disabled={isGuest}><Plus /> Add course</Button>}
      </PageHeader>
      {isGuest && <GuestSampleNotice what="learning" />}
      {!data ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatTile id="learning-assigned" icon={BookOpen} label="My courses" value={mine.length} hint={`${mine.length - done.length} to finish`} />
            <StatTile id="learning-completed" icon={Award} label="Certificates" value={done.length} />
            <StatTile id="learning-overdue" icon={Clock} label="Overdue" value={overdue.length} hint={overdue.length ? 'Finish these first' : 'You’re on track'} />
          </div>
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger id="learning-tab-mine" value="mine">My learning</TabsTrigger>
              <TabsTrigger id="learning-tab-catalogue" value="catalogue">Catalogue</TabsTrigger>
              {data.compliance && <TabsTrigger id="learning-tab-compliance" value="compliance">Compliance</TabsTrigger>}
            </TabsList>

            <TabsContent value="mine" className="mt-4 space-y-3">
              {mine.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">Nothing assigned yet. Browse the catalogue to pick a course.</Card>}
              {mine.map((enrollment) => (
                <Card key={enrollment.id} id={`learning-enrollment-${enrollment.id}`}>
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{enrollment.course.title}</p>
                      <CourseMeta course={enrollment.course} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {enrollment.status === 'completed'
                          ? `Completed ${format(new Date(enrollment.completedAt!), 'd MMM yyyy')} · Certificate ${enrollment.certificateNo}`
                          : enrollment.dueAt
                            ? `${enrollment.overdue ? 'Was due' : 'Due'} ${format(new Date(enrollment.dueAt), 'd MMM yyyy')}${enrollment.assignedByName ? ` · assigned by ${enrollment.assignedByName}` : ''}`
                            : 'No due date'}
                      </p>
                    </div>
                    {enrollment.overdue ? <StatusPill tone="bad">Overdue</StatusPill> : <StatusPill tone={TONE[enrollment.status]}>{ENROLLMENT_LABEL[enrollment.status]}</StatusPill>}
                    {enrollment.course.url && (
                      <Button id={`learning-enrollment-${enrollment.id}-open`} variant="outline" size="sm" asChild>
                        <a href={enrollment.course.url} target="_blank" rel="noreferrer" onClick={() => enrollment.status === 'assigned' && void act(enrollment, 'start')}><ExternalLink /> Open</a>
                      </Button>
                    )}
                    {enrollment.status === 'assigned' && !enrollment.course.url && <Button id={`learning-enrollment-${enrollment.id}-start`} size="sm" variant="outline" onClick={() => void act(enrollment, 'start')}>Start</Button>}
                    {enrollment.status !== 'completed' && <Button id={`learning-enrollment-${enrollment.id}-complete`} size="sm" onClick={() => void act(enrollment, 'complete')}><CheckCircle2 /> Mark complete</Button>}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="catalogue" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.catalogue.length === 0 && <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">No courses yet.</Card>}
              {data.catalogue.map((course) => (
                <Card key={course.id} id={`learning-course-${course.id}`} className={course.active ? '' : 'opacity-60'}>
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
                      {isPeopleTeam && <Button id={`learning-course-${course.id}-edit`} size="icon" variant="ghost" aria-label={`Edit ${course.title}`} onClick={() => setEditing({ course })}><Pencil /></Button>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{course.title}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                    </div>
                    <CourseMeta course={course} />
                    <div className="flex gap-2">
                      <Button id={`learning-course-${course.id}-enrol`} className="flex-1" variant={enrolled.has(course.id) ? 'outline' : 'default'} disabled={isGuest || enrolled.has(course.id) || !course.active} onClick={async () => { const next = await run<LearningOverview>('/api/learning', 'POST', { courseId: course.id }, 'Added to My learning'); if (next) setData(next); }}>
                        {enrolled.has(course.id) ? 'In My learning' : 'Start course'}
                      </Button>
                      {canAssign && course.active && <Button id={`learning-course-${course.id}-assign`} variant="outline" onClick={() => setAssigning(course)}><UserPlus /> Assign</Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {data.compliance && (
              <TabsContent value="compliance" className="mt-4">
                <Card className="divide-y">
                  {data.compliance.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">Add a course to start tracking completion.</p>}
                  {data.compliance.map((row) => {
                    const pct = row.assigned ? Math.round((row.completed / row.assigned) * 100) : 0;
                    return (
                      <div key={row.course.id} id={`learning-compliance-${row.course.id}`} className="grid items-center gap-3 px-4 py-4 sm:grid-cols-[1fr_220px_140px]">
                        <div className="min-w-0"><p className="truncate font-medium">{row.course.title}</p><CourseMeta course={row.course} /></div>
                        <div className="space-y-1"><Progress value={pct} /><p className="text-xs text-muted-foreground">{row.completed} of {row.assigned} completed ({pct}%)</p></div>
                        <div className="text-right">{row.overdue ? <StatusPill tone="bad">{row.overdue} overdue</StatusPill> : <StatusPill tone="ok">On track</StatusPill>}</div>
                      </div>
                    );
                  })}
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      <CourseDialog open={!!editing} course={editing?.course ?? null} onOpenChange={(open) => !open && setEditing(null)} onSubmit={async (input) => { const next = await run<LearningOverview>('/api/learning/courses', 'POST', input, 'Course saved'); if (next) setData(next); return !!next; }} />
      <AssignDialog
        course={assigning}
        people={assignable}
        canAssignEveryone={isPeopleTeam}
        onOpenChange={(open) => !open && setAssigning(null)}
        onSubmit={async (input) => { const result = await run<{ assigned: number; alreadyHad: number }>('/api/learning/assign', 'POST', input, 'Course assigned'); if (result) await load(); return !!result; }}
      />
    </>
  );
}
