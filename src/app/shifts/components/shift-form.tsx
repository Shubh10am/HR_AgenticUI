'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SHIFT_COLORS, WEEKDAYS } from '@/lib/shifts';
import { cn } from '@/lib/utils';

export const SHIFT_TONE: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200',
};

/** Create a shift pattern (HR and admins). */
export default function ShiftForm({ onCreate }: { onCreate: (input: Record<string, unknown>) => Promise<boolean> }) {
  const [form, setForm] = useState({ name: '', start: '09:00', end: '18:00', graceMinutes: 15, weeklyOff: [0, 6], color: 'sky' });
  const [busy, setBusy] = useState(false);
  const toggleDay = (day: number) => setForm({ ...form, weeklyOff: form.weeklyOff.includes(day) ? form.weeklyOff.filter((d) => d !== day) : [...form.weeklyOff, day] });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New shift</CardTitle>
        <CardDescription>Attendance marks people late after the start time plus the grace period, and doesn&apos;t expect them on their days off.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="shift-name">Name</Label><Input id="shift-name" value={form.name} maxLength={40} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Support evening" /></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5"><Label htmlFor="shift-start">Starts</Label><Input id="shift-start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="shift-end">Ends</Label><Input id="shift-end" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="shift-grace">Grace (min)</Label><Input id="shift-grace" type="number" min={0} max={120} value={form.graceMinutes} onChange={(e) => setForm({ ...form, graceMinutes: Number(e.target.value) })} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Days off</Label>
          <div className="flex gap-1">
            {WEEKDAYS.map((label, day) => (
              <button key={label} type="button" id={`shift-off-${day}`} aria-pressed={form.weeklyOff.includes(day)} onClick={() => toggleDay(day)} className={cn('flex-1 rounded-md border py-1.5 text-xs font-medium', form.weeklyOff.includes(day) ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground')}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {SHIFT_COLORS.map((color) => (
            <button key={color} type="button" id={`shift-color-${color}`} aria-label={color} aria-pressed={form.color === color} onClick={() => setForm({ ...form, color })} className={cn('h-7 w-7 rounded-full', SHIFT_TONE[color], form.color === color && 'ring-2 ring-primary ring-offset-2 ring-offset-background')} />
          ))}
        </div>
        <Button id="shift-create" className="w-full" disabled={busy || !form.name.trim()} onClick={async () => { setBusy(true); if (await onCreate(form)) setForm({ ...form, name: '' }); setBusy(false); }}>
          {busy && <Loader2 className="animate-spin" />} Create shift
        </Button>
      </CardContent>
    </Card>
  );
}
