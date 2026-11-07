'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Plus, Save, Send, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusPill from '@/components/status-pill';
import ApprovalTimeline from '@/components/approvals/approval-timeline';
import { storedDateOf } from '@/lib/attendance';
import { TIMESHEET_STATUS_LABEL, type TimesheetWeekView, type WeekEntry } from '@/lib/timesheets';

type Grid = { projectId: string; hours: Record<string, string> }[];

const toGrid = (week: TimesheetWeekView): Grid => {
  const rows = new Map<string, Record<string, string>>();
  for (const entry of week.entries) rows.set(entry.projectId, { ...(rows.get(entry.projectId) ?? {}), [entry.date]: String(entry.hours) });
  return rows.size ? [...rows.entries()].map(([projectId, hours]) => ({ projectId, hours })) : [{ projectId: week.projects[0]?.id ?? '', hours: {} }];
};

interface Props {
  week: TimesheetWeekView;
  onSave: (entries: WeekEntry[]) => Promise<boolean>;
  onSubmit: () => Promise<boolean>;
  onWithdraw: () => Promise<boolean>;
}

/** One week of time: a row per project, a column per day. */
export default function WeekGrid({ week, onSave, onSubmit, onWithdraw }: Props) {
  const [grid, setGrid] = useState<Grid>(() => toGrid(week));
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => setGrid(toGrid(week)), [week]);

  const entries = useMemo<WeekEntry[]>(
    () => grid.flatMap((row) => week.days.map((date) => ({ projectId: row.projectId, date, hours: Number(row.hours[date] || 0), note: '' })).filter((entry) => entry.projectId && entry.hours > 0)),
    [grid, week.days]
  );
  const dayTotal = (date: string) => entries.filter((entry) => entry.date === date).reduce((total, entry) => total + entry.hours, 0);
  const total = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const dirty = JSON.stringify(entries.map((e) => [e.projectId, e.date, e.hours]).sort()) !== JSON.stringify(week.entries.map((e) => [e.projectId, e.date, e.hours]).sort());
  const act = async (name: string, fn: () => Promise<boolean>) => { setBusy(name); await fn(); setBusy(null); };

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={week.status === 'approved' ? 'ok' : week.status === 'submitted' ? 'warn' : week.status === 'rejected' ? 'bad' : 'neutral'}>{TIMESHEET_STATUS_LABEL[week.status]}</StatusPill>
        {week.approval && <ApprovalTimeline approval={week.approval} compact />}
        <span className="ml-auto text-sm font-semibold">{total} h this week</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="pb-2 text-left font-medium">Project</th>
              {week.days.map((date) => <th key={date} className="w-20 pb-2 font-medium">{format(storedDateOf(date), 'EEE d')}</th>)}
              <th className="w-16 pb-2 font-medium">Total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {grid.map((row, index) => (
              <tr key={index}>
                <td className="min-w-[220px] py-1 pr-2">
                  <Select value={row.projectId} disabled={!week.editable} onValueChange={(projectId) => setGrid(grid.map((r, i) => (i === index ? { ...r, projectId } : r)))}>
                    <SelectTrigger id={`timesheet-row-${index}-project`} aria-label="Project"><SelectValue placeholder="Choose a project" /></SelectTrigger>
                    <SelectContent>{week.projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.code ? `${project.code} · ` : ''}{project.name}{project.billable ? '' : ' (internal)'}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                {week.days.map((date) => (
                  <td key={date} className="px-1 py-1">
                    <Input
                      id={`timesheet-row-${index}-${date}`}
                      type="number"
                      min={0}
                      max={24}
                      step={0.25}
                      disabled={!week.editable}
                      value={row.hours[date] ?? ''}
                      onChange={(e) => setGrid(grid.map((r, i) => (i === index ? { ...r, hours: { ...r.hours, [date]: e.target.value } } : r)))}
                      className="h-9 px-2 text-center"
                      aria-label={`Hours on ${date}`}
                    />
                  </td>
                ))}
                <td className="text-center font-semibold">{week.days.reduce((sum, date) => sum + Number(row.hours[date] || 0), 0)}</td>
                <td>{week.editable && grid.length > 1 && <Button variant="ghost" size="icon" aria-label="Remove row" onClick={() => setGrid(grid.filter((_, i) => i !== index))}><Trash2 /></Button>}</td>
              </tr>
            ))}
            <tr className="text-xs text-muted-foreground">
              <td className="pt-2">Day total</td>
              {week.days.map((date) => <td key={date} className={`pt-2 text-center ${dayTotal(date) > 12 ? 'font-semibold text-amber-600' : ''}`}>{dayTotal(date) || ''}</td>)}
              <td className="pt-2 text-center font-semibold text-foreground">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        {week.editable ? (
          <Button id="timesheet-add-row" variant="outline" size="sm" onClick={() => setGrid([...grid, { projectId: '', hours: {} }])}><Plus /> Add project</Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {week.status === 'submitted' && <Button id="timesheet-withdraw" variant="outline" disabled={!!busy} onClick={() => void act('withdraw', onWithdraw)}>{busy === 'withdraw' ? <Loader2 className="animate-spin" /> : <Undo2 />} Withdraw</Button>}
          {week.editable && (
            <>
              <Button id="timesheet-save" variant="outline" disabled={!!busy || !dirty} onClick={() => void act('save', () => onSave(entries))}>{busy === 'save' ? <Loader2 className="animate-spin" /> : <Save />} Save</Button>
              <Button id="timesheet-submit" disabled={!!busy || total === 0} onClick={() => void act('submit', async () => (dirty ? (await onSave(entries)) && onSubmit() : onSubmit()))}>
                {busy === 'submit' ? <Loader2 className="animate-spin" /> : <Send />} Submit week
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
