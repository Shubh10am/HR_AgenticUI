'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OneOnOneOverview } from '@/lib/one-on-ones';

type Submit = (input: Record<string, unknown>) => Promise<boolean>;

function ScheduleForm({ people, onSubmit, onDone }: { people: OneOnOneOverview['people']; onSubmit: Submit; onDone: () => void }) {
  const [form, setForm] = useState({ withId: people.length === 1 ? people[0].id : '', when: '', firstItem: '' });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const ok = await onSubmit({ withId: form.withId, scheduledFor: new Date(form.when).toISOString(), firstItem: form.firstItem });
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="one-on-one-with">With</Label>
        <Select value={form.withId} onValueChange={(withId) => setForm({ ...form, withId })}>
          <SelectTrigger id="one-on-one-with"><SelectValue placeholder="Choose a person" /></SelectTrigger>
          <SelectContent>{people.map((person) => <SelectItem key={person.id} value={person.id}>{person.name} · {person.relation === 'manager' ? 'your manager' : 'reports to you'}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label htmlFor="one-on-one-when">When</Label><Input id="one-on-one-when" type="datetime-local" value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="one-on-one-first-item">First agenda item (optional)</Label><Input id="one-on-one-first-item" maxLength={200} placeholder="e.g. Plans for next quarter" value={form.firstItem} onChange={(e) => setForm({ ...form, firstItem: e.target.value })} /></div>
      <p className="text-xs text-muted-foreground">Unfinished action items from your last 1:1 together carry over automatically.</p>
      <DialogFooter><Button id="one-on-one-schedule-submit" type="submit" disabled={busy || !form.withId || !form.when}>Book 1:1</Button></DialogFooter>
    </form>
  );
}

export default function ScheduleDialog({ open, people, onOpenChange, onSubmit }: { open: boolean; people: OneOnOneOverview['people']; onOpenChange: (open: boolean) => void; onSubmit: Submit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Book a 1:1</DialogTitle><DialogDescription>A regular check-in between a manager and their direct report.</DialogDescription></DialogHeader>
        {open && <ScheduleForm people={people} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
