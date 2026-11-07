'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dayKeyOf, dayKeysBetween, isWeekend } from '@/lib/attendance';
import type { HolidayView, LeaveBalance } from '@/lib/leave';

function LeaveForm({ balances, holidays, onSubmit, onCancel }: { balances: LeaveBalance[]; holidays: HolidayView[]; onSubmit: (input: Record<string, string>) => Promise<boolean>; onCancel: () => void }) {
  const [leaveType, setLeaveType] = useState(balances[0]?.type ?? 'Annual');
  const [startDate, setStartDate] = useState(dayKeyOf());
  const [endDate, setEndDate] = useState(dayKeyOf());
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const closed = useMemo(() => new Set(holidays.filter((holiday) => !holiday.optional).map((holiday) => holiday.date)), [holidays]);
  const days = endDate >= startDate ? dayKeysBetween(startDate, endDate).filter((day) => !isWeekend(day) && !closed.has(day)).length : 0;
  const balance = balances.find((item) => item.type === leaveType);
  const over = balance?.available != null && days > balance.available;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="leave-type">Type</Label>
        <Select value={leaveType} onValueChange={(value) => setLeaveType(value as typeof leaveType)}>
          <SelectTrigger id="leave-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            {balances.map((item) => <SelectItem key={item.type} value={item.type}>{item.type}{item.available != null ? ` · ${item.available} available` : ''}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="leave-start">From</Label><Input id="leave-start" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }} /></div>
        <div className="space-y-1.5"><Label htmlFor="leave-end">To</Label><Input id="leave-end" type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
      </div>
      <p className={`text-sm ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
        {days} working day{days === 1 ? '' : 's'} (weekends and holidays are not counted){over ? ` — more than the ${balance!.available} available` : ''}.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="leave-reason">Note for your manager (optional)</Label>
        <Textarea id="leave-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Please don't include medical details." />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button id="leave-submit" disabled={busy || days === 0 || over} onClick={async () => { setBusy(true); await onSubmit({ leaveType, startDate, endDate, reason }); setBusy(false); }}>
          {busy && <Loader2 className="animate-spin" />} Request leave
        </Button>
      </DialogFooter>
    </div>
  );
}

/** Request leave, with a live count of working days against the balance. */
export default function RequestLeaveDialog({ open, onOpenChange, balances, holidays, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; balances: LeaveBalance[]; holidays: HolidayView[]; onSubmit: (input: Record<string, string>) => Promise<boolean> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request leave</DialogTitle>
          <DialogDescription>It goes to your approvers. Colleagues see that you are away, not the type of leave.</DialogDescription>
        </DialogHeader>
        {open && <LeaveForm balances={balances} holidays={holidays} onCancel={() => onOpenChange(false)} onSubmit={async (input) => { const ok = await onSubmit(input); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}
