'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_NOTICE_DAYS, EXIT_REASONS } from '@/lib/offboarding';

const dayAfter = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

export interface StartExitInput {
  employeeId?: string;
  reason: string;
  lastWorkingDay: string;
  note: string;
}

function ExitForm({ people, onSubmit, onCancel }: { people: { id: string; name: string }[] | null; onSubmit: (input: StartExitInput) => Promise<boolean>; onCancel: () => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState<string>(people ? 'End of contract' : 'Resignation');
  const [lastWorkingDay, setLastWorkingDay] = useState(dayAfter(DEFAULT_NOTICE_DAYS));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = (!people || employeeId) && lastWorkingDay;

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!ready || busy) return;
        setBusy(true);
        await onSubmit({ employeeId: people ? employeeId : undefined, reason, lastWorkingDay, note });
        setBusy(false);
      }}
    >
      {people && (
        <div className="space-y-1.5">
          <Label htmlFor="exit-person">Person</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger id="exit-person"><SelectValue placeholder="Choose a colleague" /></SelectTrigger>
            <SelectContent>{people.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="exit-reason">Reason</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger id="exit-reason"><SelectValue /></SelectTrigger>
            <SelectContent>{EXIT_REASONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exit-last-day">Last working day</Label>
          <Input id="exit-last-day" type="date" min={dayAfter(0)} value={lastWorkingDay} onChange={(event) => setLastWorkingDay(event.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="exit-note">Note (optional)</Label>
        <Textarea id="exit-note" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder={people ? 'Context for the manager and HR' : 'Anything you would like your manager and HR to know'} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button id="exit-submit" type="submit" disabled={!ready || busy} variant={people ? 'default' : 'destructive'}>
          {busy && <Loader2 className="animate-spin" />} {people ? 'Start exit' : 'Submit resignation'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Resign (for yourself) or, for HR and admins, start an exit for a colleague. */
export default function StartExitDialog({ open, onOpenChange, people, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; people: { id: string; name: string }[] | null; onSubmit: (input: StartExitInput) => Promise<boolean> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{people ? 'Start an exit' : 'Submit your resignation'}</DialogTitle>
          <DialogDescription>
            {people
              ? 'The exit checklist starts straight away. Assign the last working day agreed with the person.'
              : `Your manager and HR are asked to accept it. The default notice is ${DEFAULT_NOTICE_DAYS} days; you can withdraw it until it completes.`}
          </DialogDescription>
        </DialogHeader>
        {open && <ExitForm people={people} onCancel={() => onOpenChange(false)} onSubmit={async (input) => { const ok = await onSubmit(input); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}
