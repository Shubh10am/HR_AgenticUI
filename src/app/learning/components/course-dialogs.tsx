'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COURSE_CATEGORIES, type CourseView } from '@/lib/learning';

type Submit = (input: Record<string, unknown>) => Promise<boolean>;

function CourseForm({ course, onSubmit, onDone }: { course: CourseView | null; onSubmit: Submit; onDone: () => void }) {
  const [form, setForm] = useState({
    title: course?.title ?? '',
    description: course?.description ?? '',
    category: course?.category ?? 'Skills',
    url: course?.url ?? '',
    durationMins: String(course?.durationMins ?? 30),
    dueInDays: String(course?.dueInDays ?? 30),
    mandatory: course?.mandatory ?? false,
    active: course?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const ok = await onSubmit({ id: course?.id, ...form });
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <div className="space-y-1.5"><Label htmlFor="course-title">Title</Label><Input id="course-title" value={form.title} maxLength={120} placeholder="e.g. Information security basics" onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="course-description">What people will learn</Label><Textarea id="course-description" rows={3} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="course-category">Category</Label>
          <Select value={form.category} onValueChange={(category) => setForm({ ...form, category: category as CourseView['category'] })}>
            <SelectTrigger id="course-category"><SelectValue /></SelectTrigger>
            <SelectContent>{COURSE_CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="course-duration">Length (minutes)</Label><Input id="course-duration" type="number" min={1} value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="course-url">Course link (https)</Label><Input id="course-url" type="url" placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="course-due">Finish within (days)</Label><Input id="course-due" type="number" min={1} max={365} value={form.dueInDays} onChange={(e) => setForm({ ...form, dueInDays: e.target.value })} /></div>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2"><Switch id="course-mandatory" checked={form.mandatory} onCheckedChange={(mandatory) => setForm({ ...form, mandatory })} /><Label htmlFor="course-mandatory">Mandatory for everyone</Label></div>
        <div className="flex items-center gap-2"><Switch id="course-active" checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /><Label htmlFor="course-active">Show in catalogue</Label></div>
      </div>
      {form.mandatory && <p className="text-xs text-muted-foreground">Saving assigns this course to every colleague, due in {form.dueInDays || '…'} days. New joiners get it automatically.</p>}
      <DialogFooter><Button id="course-save" type="submit" disabled={busy || !form.title.trim()}>Save course</Button></DialogFooter>
    </form>
  );
}

export function CourseDialog({ open, course, onOpenChange, onSubmit }: { open: boolean; course: CourseView | null; onOpenChange: (open: boolean) => void; onSubmit: Submit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{course ? 'Edit course' : 'Add a course'}</DialogTitle><DialogDescription>Link to training hosted anywhere; people mark it complete here.</DialogDescription></DialogHeader>
        {open && <CourseForm course={course} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AssignForm({ course, people, canAssignEveryone, onSubmit, onDone }: { course: CourseView; people: { id: string; name: string }[]; canAssignEveryone: boolean; onSubmit: Submit; onDone: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [everyone, setEveryone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const ok = await onSubmit({ courseId: course.id, employeeIds: chosen, everyone });
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <div className="flex items-center gap-2"><Switch id="assign-everyone" checked={everyone} onCheckedChange={setEveryone} /><Label htmlFor="assign-everyone">{canAssignEveryone ? 'Everyone in the organisation' : 'All my direct reports'}</Label></div>
      {!everyone && (
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
          {people.length === 0 && <p className="text-sm text-muted-foreground">Nobody to assign to.</p>}
          {people.map((person) => (
            <label key={person.id} htmlFor={`assign-person-${person.id}`} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox id={`assign-person-${person.id}`} checked={chosen.includes(person.id)} onCheckedChange={(checked) => setChosen((current) => (checked ? [...current, person.id] : current.filter((id) => id !== person.id)))} />
              {person.name}
            </label>
          ))}
        </div>
      )}
      <DialogFooter><Button id="assign-submit" type="submit" disabled={busy || (!everyone && chosen.length === 0)}>Assign course</Button></DialogFooter>
    </form>
  );
}

export function AssignDialog({ course, people, canAssignEveryone, onOpenChange, onSubmit }: { course: CourseView | null; people: { id: string; name: string }[]; canAssignEveryone: boolean; onOpenChange: (open: boolean) => void; onSubmit: Submit }) {
  return (
    <Dialog open={!!course} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign “{course?.title}”</DialogTitle><DialogDescription>They’ll see it under My learning with a due date of {course?.dueInDays} days from today.</DialogDescription></DialogHeader>
        {course && <AssignForm course={course} people={people} canAssignEveryone={canAssignEveryone} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
