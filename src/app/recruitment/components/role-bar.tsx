'use client';

import { Briefcase, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RecruitmentStore } from '../store';
import { SAMPLE_ROLE } from '../sample-data';

export default function RoleBar({ store }: { store: RecruitmentStore }) {
  const { roles, activeRole } = store;
  return (
    <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Briefcase className="h-5 w-5" /></span>
        <div className="text-sm">
          <p className="font-semibold">Open role</p>
          <p className="text-xs text-muted-foreground">{roles.length ? `${roles.length} role${roles.length === 1 ? '' : 's'} · ${activeRole?.candidates.length ?? 0} candidates in this one` : 'Create a role to start hiring'}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
        {roles.length > 0 && (
          <Select value={activeRole?.id} onValueChange={store.setActiveRoleId}>
            <SelectTrigger id="recruitment-role-select" className="w-full sm:w-64"><SelectValue placeholder="Choose a role" /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.details.title || 'Untitled role'} · {r.candidates.length}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button id="recruitment-new-role" variant="outline" onClick={() => store.createRole()}><Plus className="mr-1.5 h-4 w-4" />New role</Button>
        {roles.length === 0 && (
          <Button id="recruitment-sample-role" onClick={() => store.createRole(SAMPLE_ROLE)}><Sparkles className="mr-1.5 h-4 w-4" />Try a sample role</Button>
        )}
        {activeRole && (
          <Button id="recruitment-delete-role" variant="ghost" size="icon" aria-label="Delete this role" title="Delete this role and its candidates"
            onClick={() => { if (window.confirm(`Delete “${activeRole.details.title || 'Untitled role'}” and its ${activeRole.candidates.length} candidates?`)) store.deleteRole(activeRole.id); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </Card>
  );
}
