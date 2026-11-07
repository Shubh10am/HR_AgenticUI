'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dayKeyOf } from '@/lib/attendance';
import type { ShiftView } from '@/lib/shifts';

function AssignForm({ shift, people, onSubmit, onCancel }: { shift: ShiftView | 'standard'; people: { id: string; name: string; department: string }[]; onSubmit: (ids: string[], from: string) => Promise<boolean>; onCancel: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState(dayKeyOf());
  const [busy, setBusy] = useState(false);
  const shown = useMemo(() => people.filter((person) => `${person.name} ${person.department}`.toLowerCase().includes(query.toLowerCase())), [people, query]);
  return (
    <div className="space-y-3">
      <div className="space-y-1.5"><Label htmlFor="shift-assign-from">Starting</Label><Input id="shift-assign-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="shift-assign-search" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people or teams" /></div>
      <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2">
        {shown.map((person) => (
          <label key={person.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/60">
            <Checkbox id={`shift-assign-${person.id}`} checked={selected.has(person.id)} onCheckedChange={() => { const next = new Set(selected); if (next.has(person.id)) next.delete(person.id); else next.add(person.id); setSelected(next); }} />
            <span className="text-sm">{person.name}</span><span className="text-xs text-muted-foreground">{person.department}</span>
          </label>
        ))}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button id="shift-assign-submit" disabled={busy || selected.size === 0} onClick={async () => { setBusy(true); await onSubmit([...selected], from); setBusy(false); }}>
          {busy && <Loader2 className="animate-spin" />} Assign {selected.size || ''} {shift === 'standard' ? 'to standard hours' : `to ${shift.name}`}
        </Button>
      </DialogFooter>
    </div>
  );
}

/** Puts people on a shift (or back on standard hours) from a date. */
export default function AssignDialog({ shift, people, onOpenChange, onSubmit }: { shift: ShiftView | 'standard' | null; people: { id: string; name: string; department: string }[]; onOpenChange: (open: boolean) => void; onSubmit: (ids: string[], from: string) => Promise<boolean> }) {
  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shift === 'standard' ? 'Move to standard hours' : `Assign people to ${shift?.name ?? ''}`}</DialogTitle>
          <DialogDescription>Their previous shift ends the day before.</DialogDescription>
        </DialogHeader>
        {shift && <AssignForm shift={shift} people={people} onCancel={() => onOpenChange(false)} onSubmit={async (ids, from) => { const ok = await onSubmit(ids, from); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}
