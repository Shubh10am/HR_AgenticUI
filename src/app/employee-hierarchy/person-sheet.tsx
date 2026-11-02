'use client';

import { useMemo, useState } from 'react';
import { Briefcase, Building2, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { descendantsOf, subtitleOf, type OrgPerson } from '@/lib/hierarchy';
import PersonAvatar from './person-avatar';

const NO_MANAGER = 'none';

interface PersonSheetProps {
  person: OrgPerson | null;
  people: OrgPerson[];
  canEdit: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  /** Saves the change; resolves to an error message, or null on success. */
  onSave: (id: string, change: { managerId: string | null; jobTitle: string }) => Promise<string | null>;
}

export default function PersonSheet({ person, people, canEdit, onClose, onSelect, onSave }: PersonSheetProps) {
  return (
    <Sheet open={Boolean(person)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent id="hierarchy-person-sheet" className="w-full overflow-y-auto sm:max-w-md">
        {/* Keyed so the edit form resets when another person is opened. */}
        {person && <PersonDetails key={person.id} person={person} people={people} canEdit={canEdit} onSelect={onSelect} onSave={onSave} />}
      </SheetContent>
    </Sheet>
  );
}

function PersonDetails({ person, people, canEdit, onSelect, onSave }: Omit<PersonSheetProps, 'person' | 'onClose'> & { person: OrgPerson }) {
  const manager = people.find((candidate) => candidate.id === person.managerId) ?? null;
  const directReports = people.filter((candidate) => candidate.managerId === person.id);
  const blocked = useMemo(() => descendantsOf(people, person.id), [people, person.id]);
  const managerOptions = people.filter((candidate) => candidate.id !== person.id && !blocked.has(candidate.id));

  const [managerId, setManagerId] = useState(person.managerId ?? NO_MANAGER);
  const [jobTitle, setJobTitle] = useState(person.jobTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = managerId !== (person.managerId ?? NO_MANAGER) || jobTitle.trim() !== person.jobTitle;

  const save = async () => {
    setSaving(true);
    setError(null);
    const problem = await onSave(person.id, { managerId: managerId === NO_MANAGER ? null : managerId, jobTitle: jobTitle.trim() });
    setSaving(false);
    if (problem) setError(problem);
  };

  const facts = [
    { icon: Mail, label: 'Email', value: person.email },
    { icon: Building2, label: 'Department', value: person.department || 'Not set' },
    { icon: ShieldCheck, label: 'Access role', value: person.role },
  ];

  return (
    <>
      <SheetHeader className="items-center text-center">
        <PersonAvatar person={person} className="h-16 w-16 text-xl" />
        <SheetTitle>{person.name}</SheetTitle>
        <SheetDescription>{subtitleOf(person) || 'No job title yet'}</SheetDescription>
      </SheetHeader>

      <dl className="mt-6 space-y-3 rounded-lg border p-4 text-sm">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-center gap-3">
            <fact.icon className="h-4 w-4 text-muted-foreground" />
            <dt className="w-24 text-muted-foreground">{fact.label}</dt>
            <dd className="min-w-0 flex-1 truncate font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reports to</h3>
        {manager ? (
          <PersonLink person={manager} onSelect={onSelect} />
        ) : (
          <p className="text-sm text-muted-foreground">Nobody — top of the chart.</p>
        )}
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Direct reports ({directReports.length})</h3>
        {directReports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one reports to {person.name.split(' ')[0]}.</p>
        ) : (
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {directReports.map((report) => (
              <PersonLink key={report.id} person={report} onSelect={onSelect} />
            ))}
          </div>
        )}
      </section>

      {canEdit && (
        <section id="hierarchy-edit" className="mt-6 space-y-4 rounded-lg border bg-muted/30 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="h-4 w-4" /> Edit position
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="hierarchy-edit-manager">Reports to</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger id="hierarchy-edit-manager">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MANAGER}>No manager (top of the chart)</SelectItem>
                {managerOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} — {subtitleOf(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">People in {person.name.split(' ')[0]}&apos;s own team are left out, so the chart can&apos;t loop.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hierarchy-edit-title">Job title</Label>
            <Input id="hierarchy-edit-title" value={jobTitle} maxLength={80} placeholder="e.g. Engineering Manager" onChange={(event) => setJobTitle(event.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button id="hierarchy-edit-save" className="w-full" disabled={!isDirty || saving} onClick={save}>
            {saving && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </section>
      )}
    </>
  );
}

function PersonLink({ person, onSelect }: { person: OrgPerson; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      id={`hierarchy-person-link-${person.id}`}
      onClick={() => onSelect(person.id)}
      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
    >
      <PersonAvatar person={person} className="h-8 w-8 text-xs" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{person.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitleOf(person)}</span>
      </span>
    </button>
  );
}
