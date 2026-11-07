'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAX_AWARD, type RewardItemView } from '@/lib/rewards';

type Submit<T> = (input: T) => Promise<boolean>;

function ItemForm({ item, onSubmit, onDone }: { item: RewardItemView | null; onSubmit: Submit<Record<string, unknown>>; onDone: () => void }) {
  const [form, setForm] = useState({ name: item?.name ?? '', description: item?.description ?? '', cost: String(item?.cost ?? 500), stock: item?.stock == null ? '' : String(item.stock), active: item?.active ?? true });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const ok = await onSubmit({ id: item?.id, ...form, stock: form.stock === '' ? null : form.stock });
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <div className="space-y-1.5"><Label htmlFor="reward-item-name">Reward</Label><Input id="reward-item-name" value={form.name} maxLength={80} placeholder="e.g. Coffee voucher" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="reward-item-description">Description</Label><Input id="reward-item-description" value={form.description} maxLength={300} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="reward-item-cost">Cost (points)</Label><Input id="reward-item-cost" type="number" min={1} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="reward-item-stock">Stock</Label><Input id="reward-item-stock" type="number" min={0} placeholder="No limit" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
      </div>
      <div className="flex items-center gap-2"><Switch id="reward-item-active" checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /><Label htmlFor="reward-item-active">Show in the catalogue</Label></div>
      <DialogFooter><Button id="reward-item-save" type="submit" disabled={busy || !form.name.trim()}>Save reward</Button></DialogFooter>
    </form>
  );
}

export function RewardItemDialog({ open, item, onOpenChange, onSubmit }: { open: boolean; item: RewardItemView | null; onOpenChange: (open: boolean) => void; onSubmit: Submit<Record<string, unknown>> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? 'Edit reward' : 'Add a reward'}</DialogTitle><DialogDescription>Colleagues spend points they earn from kudos and awards.</DialogDescription></DialogHeader>
        {open && <ItemForm item={item} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AwardForm({ people, onSubmit, onDone }: { people: { id: string; name: string }[]; onSubmit: Submit<Record<string, unknown>>; onDone: () => void }) {
  const [form, setForm] = useState({ employeeId: '', points: '100', reason: '' });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const ok = await onSubmit(form);
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="reward-award-person">Colleague</Label>
        <Select value={form.employeeId} onValueChange={(employeeId) => setForm({ ...form, employeeId })}>
          <SelectTrigger id="reward-award-person"><SelectValue placeholder="Choose a colleague" /></SelectTrigger>
          <SelectContent>{people.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label htmlFor="reward-award-points">Points (up to {MAX_AWARD})</Label><Input id="reward-award-points" type="number" min={1} max={MAX_AWARD} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="reward-award-reason">What it’s for</Label><Input id="reward-award-reason" maxLength={200} placeholder="e.g. Led the office move" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
      <DialogFooter><Button id="reward-award-submit" type="submit" disabled={busy || !form.employeeId || !form.reason.trim()}>Award points</Button></DialogFooter>
    </form>
  );
}

export function AwardDialog({ open, people, onOpenChange, onSubmit }: { open: boolean; people: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSubmit: Submit<Record<string, unknown>> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Award points</DialogTitle><DialogDescription>Recognise something worth celebrating. The colleague sees the reason in their history.</DialogDescription></DialogHeader>
        {open && <AwardForm people={people} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
