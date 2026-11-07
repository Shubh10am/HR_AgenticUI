'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckSquare, GraduationCap, Loader2, Palmtree, ShieldCheck, TrendingDown, Users, Wallet } from 'lucide-react';
import PageHeader from '@/components/page-header';
import StatTile from '@/components/stat-tile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrgApi } from '@/hooks/use-org-api';
import { storedDateOf } from '@/lib/attendance';
import { MIN_GROUP, type PeopleReport } from '@/lib/reports';

const INK = 'hsl(var(--primary))';
const INK_2 = 'hsl(var(--muted-foreground) / 0.55)';

/** A labelled horizontal bar list; reads well for a handful of categories. */
function BarList({ rows, format: show = (n: number) => n.toLocaleString(), empty }: { rows: { label: string; value: number }[]; format?: (n: number) => string; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex justify-between text-sm"><span>{row.label}</span><span className="font-medium tabular-nums">{show(row.value)}</span></div>
          <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(row.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [report, setReport] = useState<PeopleReport | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    if (isGuest || !isPeopleTeam) return setDenied(true);
    const next = await run<PeopleReport>('/api/reports');
    if (next) setReport(next);
    else setDenied(true);
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: report?.expenses.currency ?? 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <PageHeader title="People reports" description="Headcount, joiners and leavers, absence and spend across your organisation." />
      {denied ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center"><ShieldCheck className="h-10 w-10 text-primary" /><p className="font-semibold">Reports are for HR and admins</p><p className="text-sm text-muted-foreground">Ask your HR team if you need a number.</p></Card>
      ) : !report ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile id="reports-headcount" icon={Users} label="Headcount" value={report.headcount} hint={`${report.byDepartment.length} departments`} />
            <StatTile id="reports-attrition" icon={TrendingDown} label="Attrition (12 months)" value={`${report.attritionRate}%`} hint={`${report.leaversLast12} leaver${report.leaversLast12 === 1 ? '' : 's'}`} />
            <StatTile id="reports-absence" icon={Palmtree} label="Leave taken this year" value={`${report.absence.leaveDaysThisYear} days`} hint={`${report.absence.averagePerPerson} per person`} />
            <StatTile id="reports-approvals" icon={CheckSquare} label="Open approvals" value={report.approvals.open} hint={report.approvals.open ? `Oldest ${report.approvals.oldestDays} days` : 'All clear'} />
          </div>

          <Card id="reports-joiners-leavers">
            <CardHeader><CardTitle className="text-base">Joiners and leavers</CardTitle><CardDescription>Last 12 months, by month.</CardDescription></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthly.map((m) => ({ ...m, label: format(storedDateOf(`${m.month}-01`), 'MMM') }))} margin={{ left: -20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="joiners" name="Joiners" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="leavers" name="Leavers" fill={INK_2} radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card id="reports-departments">
              <CardHeader><CardTitle className="text-base">Headcount by department</CardTitle></CardHeader>
              <CardContent><BarList rows={report.byDepartment.map((d) => ({ label: d.department, value: d.count }))} empty="No people yet." /></CardContent>
            </Card>
            <Card id="reports-exit-reasons">
              <CardHeader><CardTitle className="text-base">Why people left</CardTitle><CardDescription>Completed exits in the last 12 months. Reasons given by only one person are grouped as “Other”.</CardDescription></CardHeader>
              <CardContent><BarList rows={report.exitReasons.map((r) => ({ label: r.reason, value: r.count }))} empty="No completed exits in the last 12 months." /></CardContent>
            </Card>
            <Card id="reports-leave-types">
              <CardHeader><CardTitle className="text-base">Leave by type this year</CardTitle><CardDescription>Working days. Types taken by fewer than {MIN_GROUP} people are grouped as “Other”.</CardDescription></CardHeader>
              <CardContent><BarList rows={report.absence.byType.map((t) => ({ label: t.type, value: t.days }))} format={(n) => `${n} days`} empty="No approved leave yet this year." /></CardContent>
            </Card>
            <Card id="reports-expenses">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4 text-primary" /> Approved expenses this year</CardTitle><CardDescription>{money(report.expenses.approvedThisYear)} in total.</CardDescription></CardHeader>
              <CardContent><BarList rows={report.expenses.byCategory.map((c) => ({ label: c.category, value: c.amount }))} format={money} empty="No approved expenses yet this year." /></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card id="reports-roles">
              <CardHeader><CardTitle className="text-base">People by role</CardTitle></CardHeader>
              <CardContent><BarList rows={report.byRole.map((r) => ({ label: r.role, value: r.count }))} empty="No people yet." /></CardContent>
            </Card>
            <Card id="reports-learning">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-primary" /> Mandatory training</CardTitle></CardHeader>
              <CardContent>
                {report.learning.mandatoryCompletion === null ? <p className="py-6 text-center text-sm text-muted-foreground">No mandatory courses yet.</p> : (
                  <div className="flex items-end gap-3 py-4"><span className="font-display text-5xl font-bold">{report.learning.mandatoryCompletion}%</span><span className="pb-2 text-sm text-muted-foreground">of assigned mandatory courses completed</span></div>
                )}
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground">All figures are totals; no one is named. Generated {format(new Date(report.generatedAt), 'd MMM yyyy, h:mm a')}.</p>
        </div>
      )}
    </>
  );
}
