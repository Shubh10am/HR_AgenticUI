'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ATTENDANCE_RULES, type BoardRow } from '@/lib/attendance';

export interface AdjustChange {
  clockIn?: string;
  clockOut?: string;
  notes?: string;
  clear?: boolean;
}

interface AdjustDialogProps {
  row: BoardRow | null;
  dayLabel: string;
  onClose: () => void;
  /** Resolves to an error message, or null when saved. */
  onSave: (row: BoardRow, change: AdjustChange) => Promise<string | null>;
}

const localTime = (iso: string | null) => (iso ? formatInTimeZone(new Date(iso), ATTENDANCE_RULES.timeZone, 'HH:mm') : '');

export default function AdjustDialog({ row, dayLabel, onClose, onSave }: AdjustDialogProps) {
  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent id="attendance-adjust-dialog" className="sm:max-w-md">
        {/* Keyed so the form starts from the chosen person's current times. */}
        {row && <AdjustForm key={row.employeeId} row={row} dayLabel={dayLabel} onClose={onClose} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({ row, dayLabel, onClose, onSave }: AdjustDialogProps & { row: BoardRow }) {
  const [clockIn, setClockIn] = useState(localTime(row.clockIn) || '09:00');
  const [clockOut, setClockOut] = useState(localTime(row.clockOut));
  const [notes, setNotes] = useState(row.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (change: AdjustChange) => {
    setBusy(true);
    setError(null);
    const problem = await onSave(row, change);
    setBusy(false);
    if (problem) setError(problem);
    else onClose();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit({ clockIn, clockOut, notes });
      }}
    >
      <DialogHeader>
        <DialogTitle>Correct attendance</DialogTitle>
        <DialogDescription>
          {row.name} · {dayLabel}. Times are {ATTENDANCE_RULES.timeZoneLabel}; the change is saved with your name.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="attendance-adjust-clock-in">Clock in</Label>
            <Input id="attendance-adjust-clock-in" type="time" required value={clockIn} onChange={(event) => setClockIn(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="attendance-adjust-clock-out">Clock out</Label>
            <Input id="attendance-adjust-clock-out" type="time" value={clockOut} onChange={(event) => setClockOut(event.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attendance-adjust-notes">Reason (optional)</Label>
          <Textarea id="attendance-adjust-notes" rows={2} maxLength={300} value={notes} placeholder="e.g. Forgot to clock out; confirmed with manager" onChange={(event) => setNotes(event.target.value)} />
        </div>
        {row.adjustedBy && <p className="text-xs text-muted-foreground">Last corrected by {row.adjustedBy}.</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        {row.recordId ? (
          <Button id="attendance-adjust-clear" type="button" variant="ghost" className="text-destructive" disabled={busy} onClick={() => void submit({ clear: true })}>
            Remove this day&apos;s record
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button id="attendance-adjust-save" type="submit" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Save
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
