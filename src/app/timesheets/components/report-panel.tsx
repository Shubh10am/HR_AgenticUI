'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { dayKeyOf } from '@/lib/attendance';
import type { TimeReport } from '@/lib/timesheets';

/** Hours by project and person for a date range. */
export default function ReportPanel({ load }: { load: (from: string, to: string) => Promise<TimeReport | null> }) {
  const today = dayKeyOf();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<TimeReport | null>(null);
  const refresh = useCallback(async () => { setReport(null); setReport((await load(from, to)) ?? { from, to, totalHours: 0, billableHours: 0, byProject: [], byPerson: [] }); }, [from, to, load]);
  useEffect(() => { void refresh(); }, [refresh]);

  const exportCsv = () => {
    if (!report) return;
    const lines = [['Person', 'Department', 'Hours', 'Billable hours'], ...report.byPerson.map((row) => [row.employee.name, row.employee.department, String(row.hours), String(row.billableHours)])];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' }));
    link.download = `timesheets-${from}-to-${to}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input id="timesheet-report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" aria-label="From" />
        <Input id="timesheet-report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" aria-label="To" />
        <Button id="timesheet-report-export" variant="outline" onClick={exportCsv} disabled={!report?.byPerson.length}><Download /> CSV</Button>
        {report && <span className="ml-auto text-sm text-muted-foreground">{report.totalHours} h logged · {report.totalHours ? Math.round((report.billableHours / report.totalHours) * 100) : 0}% billable</span>}
      </div>
      {!report ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">By project</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {report.byProject.length === 0 && <p className="text-sm text-muted-foreground">No time logged in this range.</p>}
              {report.byProject.map((row) => (
                <div key={row.project.id} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{row.project.name}{row.project.client ? ` · ${row.project.client}` : ''}</span><span className="font-semibold">{row.hours} h</span></div>
                  <Progress value={(row.hours / (report.byProject[0]?.hours || 1)) * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">By person</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  {report.byPerson.map((row) => (
                    <tr key={row.employee.id} className="border-b last:border-0"><td className="py-1.5">{row.employee.name}</td><td className="text-right">{row.hours} h</td><td className="text-right text-xs text-muted-foreground">{row.billableHours} billable</td></tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
