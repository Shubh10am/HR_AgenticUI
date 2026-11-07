'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GoalView } from '@/lib/performance';

interface KrDraft {
  id?: string;
  title: string;
  start: string;
  target: string;
  current: string;
  unit: string;
}

export interface GoalInput {
  ownerId?: string;
  title: string;
  description: string;
  parentId: string | null;
  dueDate: string | null;
  keyResults: { id?: string; title: string; start: number; target: number; current: number; unit: string }[];
}

function GoalForm({ goal, goals, owners, onSubmit, onCancel }: { goal: GoalView | null; goals: GoalView[]; owners: { id: string; name: string }[]; onSubmit: (input: GoalInput) => Promise<boolean>; onCancel: () => void }) {
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? '');
  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [parentId, setParentId] = useState(goal?.parentId ?? 'none');
  const [dueDate, setDueDate] = useState(goal?.dueDate?.slice(0, 10) ?? '');
  const [krs, setKrs] = useState<KrDraft[]>(
    goal?.keyResults.map((kr) => ({ id: kr.id, title: kr.title, start: String(kr.start), target: String(kr.target), current: String(kr.current), unit: kr.unit })) ?? []
  );
  const [busy, setBusy] = useState(false);
  const update = (index: number, change: Partial<KrDraft>) => setKrs(krs.map((kr, i) => (i === index ? { ...kr, ...change } : kr)));
  const parents = goals.filter((candidate) => candidate.id !== goal?.id);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!title.trim() || busy) return;
        setBusy(true);
        await onSubmit({
          ownerId: goal ? undefined : ownerId,
          title,
          description,
          parentId: parentId === 'none' ? null : parentId,
          dueDate: dueDate || null,
          keyResults: krs.filter((kr) => kr.title.trim()).map((kr) => ({ id: kr.id, title: kr.title, start: Number(kr.start) || 0, target: Number(kr.target) || 0, current: Number(kr.current) || 0, unit: kr.unit })),
        });
        setBusy(false);
      }}
    >
      {!goal && owners.length > 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="goal-owner">Owner</Label>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger id="goal-owner"><SelectValue /></SelectTrigger>
            <SelectContent>{owners.map((owner) => <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="goal-title">Goal</Label>
        <Input id="goal-title" maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Cut onboarding time for new hires" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="goal-description">Why it matters (optional)</Label>
        <Textarea id="goal-description" rows={2} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="goal-parent">Supports</Label>
          <Select value={parentId} onValueChange={setParentId}>
            <SelectTrigger id="goal-parent"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nothing — a top-level goal</SelectItem>
              {parents.map((parent) => <SelectItem key={parent.id} value={parent.id}>{parent.title} · {parent.owner.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goal-due">Due</Label>
          <Input id="goal-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Key results</Label>
        {krs.map((kr, index) => (
          <div key={index} className="grid grid-cols-[1fr_70px_70px_70px_60px_auto] items-center gap-1.5">
            <Input id={`goal-kr-${index}-title`} value={kr.title} placeholder="Measure" onChange={(event) => update(index, { title: event.target.value })} />
            <Input id={`goal-kr-${index}-start`} type="number" value={kr.start} title="Start" placeholder="Start" onChange={(event) => update(index, { start: event.target.value })} />
            <Input id={`goal-kr-${index}-current`} type="number" value={kr.current} title="Now" placeholder="Now" onChange={(event) => update(index, { current: event.target.value })} />
            <Input id={`goal-kr-${index}-target`} type="number" value={kr.target} title="Target" placeholder="Target" onChange={(event) => update(index, { target: event.target.value })} />
            <Input id={`goal-kr-${index}-unit`} value={kr.unit} placeholder="unit" maxLength={20} onChange={(event) => update(index, { unit: event.target.value })} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove key result" onClick={() => setKrs(krs.filter((_, i) => i !== index))}><Trash2 /></Button>
          </div>
        ))}
        {krs.length < 6 && (
          <Button id="goal-kr-add" type="button" variant="outline" size="sm" onClick={() => setKrs([...krs, { title: '', start: '0', target: '100', current: '0', unit: '%' }])}>
            <Plus /> Add key result
          </Button>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button id="goal-save" type="submit" disabled={!title.trim() || busy}>{busy && <Loader2 className="animate-spin" />} {goal ? 'Save goal' : 'Create goal'}</Button>
      </DialogFooter>
    </form>
  );
}

/** Create or edit a goal with up to six measurable key results. */
export default function GoalDialog(props: { open: boolean; onOpenChange: (open: boolean) => void; goal: GoalView | null; goals: GoalView[]; owners: { id: string; name: string }[]; onSubmit: (input: GoalInput) => Promise<boolean> }) {
  const { open, onOpenChange, onSubmit, ...rest } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rest.goal ? 'Edit goal' : 'New goal'}</DialogTitle>
          <DialogDescription>Link it to a team or company goal so everyone can see how work connects.</DialogDescription>
        </DialogHeader>
        {open && <GoalForm {...rest} onCancel={() => onOpenChange(false)} onSubmit={async (input) => { const ok = await onSubmit(input); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}
