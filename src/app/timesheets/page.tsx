'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusPill from '@/components/status-pill';
import { useOrgApi } from '@/hooks/use-org-api';
import { dayKeyOf, storedDateOf } from '@/lib/attendance';
import type { ProjectView, TimeReport, TimesheetWeekView, WeekEntry } from '@/lib/timesheets';
import WeekGrid from './components/week-grid';
import ReportPanel from './components/report-panel';

const moveWeek = (day: string, by: number) => new Date(storedDateOf(day).getTime() + by * 7 * 86_400_000).toISOString().slice(0, 10);

export default function TimesheetsPage() {
  const { run, isGuest, authLoading, isPeopleTeam, role } = useOrgApi();
  const [week, setWeek] = useState(dayKeyOf());
  const [sheet, setSheet] = useState<TimesheetWeekView | null>(null);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [project, setProject] = useState({ name: '', client: '', code: '', billable: true });

  const load = useCallback(async () => {
    if (isGuest) return setSheet({ id: null, weekStart: week, days: [], status: 'draft', totalHours: 0, entries: [], projects: [], approval: null, editable: false });
    setSheet(await run<TimesheetWeekView>(`/api/timesheets?week=${week}`));
  }, [isGuest, run, week]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);
  useEffect(() => {
    if (!authLoading && isPeopleTeam && !isGuest) void run<ProjectView[]>('/api/timesheets/projects?all=1').then((next) => setProjects(next ?? []));
  }, [authLoading, isGuest, isPeopleTeam, run]);

  const loadReport = useCallback((from: string, to: string) => run<TimeReport>(`/api/timesheets/report?from=${from}&to=${to}`), [run]);
  const canReport = isPeopleTeam || role === 'Manager';

  return (
    <>
      <PageHeader title="Timesheets" description="Log hours against projects each week and submit them for approval." />
      {isGuest && <GuestSampleNotice what="timesheets" />}
      <Tabs defaultValue="week">
        <TabsList>
          <TabsTrigger id="timesheet-tab-week" value="week">My week</TabsTrigger>
          {canReport && <TabsTrigger id="timesheet-tab-report" value="report">Reports</TabsTrigger>}
          {isPeopleTeam && <TabsTrigger id="timesheet-tab-projects" value="projects">Projects</TabsTrigger>}
        </TabsList>
        <TabsContent value="week" className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button id="timesheet-prev" variant="ghost" size="icon" aria-label="Previous week" onClick={() => setWeek(moveWeek(week, -1))}><ChevronLeft /></Button>
            <span className="w-56 text-center font-semibold">{sheet?.days.length ? `${format(storedDateOf(sheet.days[0]), 'd MMM')} – ${format(storedDateOf(sheet.days[6]), 'd MMM yyyy')}` : '…'}</span>
            <Button id="timesheet-next" variant="ghost" size="icon" aria-label="Next week" onClick={() => setWeek(moveWeek(week, 1))}><ChevronRight /></Button>
            {week !== dayKeyOf() && <Button id="timesheet-this-week" variant="outline" size="sm" onClick={() => setWeek(dayKeyOf())}>This week</Button>}
          </div>
          {!sheet ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
          ) : sheet.projects.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">No projects to log time against yet.{isPeopleTeam ? ' Add one in the Projects tab.' : ' Ask HR to add your projects.'}</Card>
          ) : (
            <WeekGrid
              week={sheet}
              onSave={async (entries: WeekEntry[]) => { const next = await run<TimesheetWeekView>('/api/timesheets', 'PUT', { week: sheet.weekStart, entries }, 'Week saved'); if (next) setSheet(next); return !!next; }}
              onSubmit={async () => { const next = await run<TimesheetWeekView>('/api/timesheets', 'POST', { week: sheet.weekStart }, 'Week submitted for approval'); if (next) setSheet(next); return !!next; }}
              onWithdraw={async () => { const next = await run<TimesheetWeekView>('/api/timesheets', 'POST', { week: sheet.weekStart, action: 'withdraw' }, 'Week withdrawn'); if (next) setSheet(next); return !!next; }}
            />
          )}
        </TabsContent>
        {canReport && <TabsContent value="report" className="mt-4"><ReportPanel load={loadReport} /></TabsContent>}
        {isPeopleTeam && (
          <TabsContent value="projects" className="mt-4 space-y-4">
            <Card className="flex flex-wrap items-end gap-3 p-4">
              <div className="min-w-[200px] flex-1 space-y-1.5"><Label htmlFor="project-name">Project</Label><Input id="project-name" value={project.name} maxLength={80} onChange={(e) => setProject({ ...project, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="project-client">Client</Label><Input id="project-client" value={project.client} maxLength={80} onChange={(e) => setProject({ ...project, client: e.target.value })} /></div>
              <div className="w-28 space-y-1.5"><Label htmlFor="project-code">Code</Label><Input id="project-code" value={project.code} maxLength={20} onChange={(e) => setProject({ ...project, code: e.target.value })} /></div>
              <div className="flex items-center gap-2 pb-2"><Switch id="project-billable" checked={project.billable} onCheckedChange={(billable) => setProject({ ...project, billable })} /><Label htmlFor="project-billable">Billable</Label></div>
              <Button id="project-add" disabled={!project.name.trim()} onClick={async () => { const next = await run<ProjectView[]>('/api/timesheets/projects', 'POST', project, 'Project added'); if (next) { setProjects(next); setProject({ name: '', client: '', code: '', billable: true }); await load(); } }}><Plus /> Add</Button>
            </Card>
            <div className="space-y-2">
              {projects.map((item) => (
                <Card key={item.id} id={`project-${item.id}`}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-3">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{item.code || '—'}</span>
                    <span className="flex-1 font-medium">{item.name}{item.client ? <span className="text-muted-foreground"> · {item.client}</span> : null}</span>
                    <StatusPill tone={item.billable ? 'info' : 'neutral'}>{item.billable ? 'Billable' : 'Internal'}</StatusPill>
                    <div className="flex items-center gap-2">
                      <Switch id={`project-${item.id}-active`} checked={item.active} onCheckedChange={async (active) => { const next = await run<ProjectView[]>('/api/timesheets/projects', 'POST', { ...item, active }); if (next) setProjects(next); }} aria-label={`${item.name} active`} />
                      <span className="text-xs text-muted-foreground">{item.active ? 'Open' : 'Closed'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
