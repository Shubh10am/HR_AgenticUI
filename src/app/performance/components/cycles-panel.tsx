'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Lock, Plus, Rocket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import StatusPill from '@/components/status-pill';
import type { CycleView } from '@/lib/performance';

/** HR and admins create, launch and close review cycles. */
export default function CyclesPanel({ cycles, onCreate, onStatus }: { cycles: CycleView[]; onCreate: (name: string, dueAt: string) => Promise<boolean>; onStatus: (id: string, status: 'active' | 'closed') => void }) {
  const [name, setName] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New review cycle</CardTitle>
          <CardDescription>Launching creates a self review for everyone and a manager review for everyone with a manager.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cycle-name">Name</Label>
            <Input id="cycle-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder="H2 2026 review" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cycle-due">Due</Label>
            <Input id="cycle-due" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          </div>
          <Button
            id="cycle-create"
            className="w-full"
            disabled={!name.trim() || !dueAt || busy}
            onClick={async () => {
              setBusy(true);
              if (await onCreate(name, dueAt)) {
                setName('');
                setDueAt('');
              }
              setBusy(false);
            }}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Plus />} Create draft
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {cycles.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No review cycles yet.</Card>}
        {cycles.map((cycle) => (
          <Card key={cycle.id} id={`cycle-${cycle.id}`}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{cycle.name}</span>
                  <StatusPill tone={cycle.status === 'active' ? 'info' : cycle.status === 'closed' ? 'ok' : 'neutral'}>{cycle.status === 'active' ? 'Open' : cycle.status === 'closed' ? 'Closed' : 'Draft'}</StatusPill>
                </div>
                <p className="text-xs text-muted-foreground">Due {format(new Date(cycle.dueAt), 'd MMM yyyy')} · {cycle.questions.length} questions</p>
              </div>
              {cycle.status !== 'draft' && (
                <div className="flex w-48 items-center gap-2">
                  <Progress value={cycle.total ? (cycle.submitted / cycle.total) * 100 : 0} className="h-2" />
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{cycle.submitted}/{cycle.total}</span>
                </div>
              )}
              {cycle.status === 'draft' && <Button id={`cycle-${cycle.id}-launch`} size="sm" onClick={() => onStatus(cycle.id, 'active')}><Rocket /> Launch</Button>}
              {cycle.status === 'active' && <Button id={`cycle-${cycle.id}-close`} size="sm" variant="outline" onClick={() => onStatus(cycle.id, 'closed')}><Lock /> Close & share</Button>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
