'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AppWindow, CheckCircle2, ExternalLink, KeyRound, Loader2, Pencil, Plus, UserMinus, UserPlus } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatTile from '@/components/stat-tile';
import StatusPill, { type PillTone } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgApi } from '@/hooks/use-org-api';
import { ACCESS_LABEL, type AccessStatus, type AppsOverview, type AppView } from '@/lib/apps';
import { AppDialog, RequestDialog } from './components/app-dialogs';

const TONE: Record<AccessStatus, PillTone> = { 'pending-approval': 'warn', 'to-grant': 'info', granted: 'ok', 'to-revoke': 'warn', revoked: 'neutral', rejected: 'bad' };

export default function AppsPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [data, setData] = useState<AppsOverview | null>(null);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<{ app: AppView | null } | null>(null);
  const [requesting, setRequesting] = useState<AppView | null>(null);
  const [person, setPerson] = useState('');

  const load = useCallback(async () => {
    if (isGuest) return setData({ catalogue: [], mine: [], queue: null });
    const [overview, org] = await Promise.all([run<AppsOverview>('/api/apps'), isPeopleTeam ? run<{ people: { id: string; name: string }[] }>('/api/hierarchy') : Promise.resolve(null)]);
    setData(overview);
    setPeople(org?.people ?? []);
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const mine = data?.mine ?? [];
  const held = new Map(mine.filter((a) => !['rejected', 'revoked'].includes(a.status)).map((a) => [a.app.id, a]));

  return (
    <>
      <PageHeader title="Apps" description="The apps you use at work. Request access, see what you have, and (for HR and admins) set people up or remove access.">
        {isPeopleTeam && <Button id="apps-add" onClick={() => setEditing({ app: null })} disabled={isGuest}><Plus /> Add app</Button>}
      </PageHeader>
      {isGuest && <GuestSampleNotice what="apps" />}
      {!data ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatTile id="apps-active" icon={KeyRound} label="My active apps" value={mine.filter((a) => a.status === 'granted').length} />
            <StatTile id="apps-pending" icon={AppWindow} label="My open requests" value={mine.filter((a) => a.status === 'pending-approval' || a.status === 'to-grant').length} />
            {data.queue ? <StatTile id="apps-queue" icon={CheckCircle2} label="Tasks to do" value={data.queue.length} hint="Accounts to set up or remove" /> : <StatTile id="apps-catalogue" icon={AppWindow} label="Apps available" value={data.catalogue.length} />}
          </div>
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger id="apps-tab-mine" value="mine">My apps</TabsTrigger>
              <TabsTrigger id="apps-tab-catalogue" value="catalogue">Catalogue</TabsTrigger>
              {data.queue && <TabsTrigger id="apps-tab-queue" value="queue">Tasks{data.queue.length ? ` (${data.queue.length})` : ''}</TabsTrigger>}
              {data.queue && <TabsTrigger id="apps-tab-people" value="people">Joiners & leavers</TabsTrigger>}
            </TabsList>

            <TabsContent value="mine" className="mt-4 space-y-3">
              {mine.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">You have no apps yet. Browse the catalogue to request one.</Card>}
              {mine.map((access) => (
                <Card key={access.id} id={`apps-access-${access.id}`}>
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">{access.app.name.slice(0, 1)}</span>
                    <div className="min-w-0 flex-1"><p className="font-semibold">{access.app.name}</p><p className="text-xs text-muted-foreground">{access.app.category} · updated {format(new Date(access.updatedAt), 'd MMM yyyy')}</p></div>
                    <StatusPill tone={TONE[access.status]}>{ACCESS_LABEL[access.status]}</StatusPill>
                    {access.status === 'granted' && access.app.url && <Button id={`apps-access-${access.id}-open`} size="sm" variant="outline" asChild><a href={access.app.url} target="_blank" rel="noreferrer"><ExternalLink /> Open</a></Button>}
                    {['pending-approval', 'to-grant', 'granted'].includes(access.status) && (
                      <Button id={`apps-access-${access.id}-release`} size="sm" variant="ghost" onClick={async () => { if (window.confirm(access.status === 'granted' ? `Ask for your ${access.app.name} access to be removed?` : 'Withdraw this request?')) { const next = await run<AppsOverview>(`/api/apps/${access.id}`, 'DELETE', undefined, 'Done'); if (next) setData(next); } }}>
                        {access.status === 'granted' ? 'Remove' : 'Withdraw'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="catalogue" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.catalogue.length === 0 && <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">No apps in the catalogue yet.</Card>}
              {data.catalogue.map((app) => {
                const have = held.get(app.id);
                return (
                  <Card key={app.id} id={`apps-app-${app.id}`} className={app.active ? '' : 'opacity-60'}>
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">{app.name.slice(0, 1)}</span>
                        {isPeopleTeam && <Button id={`apps-app-${app.id}-edit`} size="icon" variant="ghost" aria-label={`Edit ${app.name}`} onClick={() => setEditing({ app })}><Pencil /></Button>}
                      </div>
                      <div className="flex-1"><p className="font-semibold">{app.name}</p><p className="text-sm text-muted-foreground">{app.description}</p></div>
                      <p className="text-xs text-muted-foreground">{app.category}{app.defaultFor.length ? ` · default for ${app.defaultFor.join(', ')}` : ''}{app.requiresApproval ? ' · needs approval' : ''}</p>
                      {have ? <StatusPill tone={TONE[have.status]}>{ACCESS_LABEL[have.status]}</StatusPill> : <Button id={`apps-app-${app.id}-request`} disabled={isGuest || !app.active} onClick={() => setRequesting(app)}>Request access</Button>}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {data.queue && (
              <TabsContent value="queue" className="mt-4">
                {data.queue.length === 0 ? <Card className="p-10 text-center text-sm text-muted-foreground">Nothing to do. Approved requests and removals appear here.</Card> : (
                  <Card className="divide-y">
                    {data.queue.map((task) => (
                      <div key={task.id} id={`apps-task-${task.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        {task.status === 'to-grant' ? <UserPlus className="h-5 w-5 text-primary" /> : <UserMinus className="h-5 w-5 text-amber-600" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{task.status === 'to-grant' ? 'Set up' : 'Remove'} {task.app.name} for {task.employee.name}</p>
                          <p className="text-xs text-muted-foreground">{task.employee.department}{task.source === 'joiner' ? ' · new joiner' : task.source === 'exit' ? ' · leaving' : ''}{task.reason ? ` · “${task.reason}”` : ''}</p>
                        </div>
                        <Button id={`apps-task-${task.id}-done`} size="sm" onClick={async () => { const next = await run<AppsOverview>(`/api/apps/${task.id}`, 'PATCH', undefined, 'Marked done'); if (next) setData(next); }}><CheckCircle2 /> Done</Button>
                      </div>
                    ))}
                  </Card>
                )}
              </TabsContent>
            )}

            {data.queue && (
              <TabsContent value="people" className="mt-4">
                <Card className="space-y-4 p-5">
                  <p className="text-sm text-muted-foreground">Starting or leaving? Create all the setup tasks for a new joiner’s default apps, or removal tasks for everything a leaver can sign in to.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={person} onValueChange={setPerson}>
                      <SelectTrigger id="apps-people-person" className="w-64"><SelectValue placeholder="Choose a person" /></SelectTrigger>
                      <SelectContent>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button id="apps-people-provision" variant="outline" disabled={!person} onClick={async () => { const r = await run<AppsOverview & { added: number }>('/api/apps/people', 'POST', { employeeId: person, action: 'provision' }); if (r) { setData(r); window.alert(r.added ? `${r.added} setup task(s) created.` : 'They already have every default app.'); } }}><UserPlus /> Set up default apps</Button>
                    <Button id="apps-people-revoke" variant="outline" disabled={!person} onClick={async () => { if (!window.confirm('Create removal tasks for all of this person’s apps?')) return; const r = await run<AppsOverview & { changed: number }>('/api/apps/people', 'POST', { employeeId: person, action: 'revoke-all' }); if (r) { setData(r); window.alert(`${r.changed} app(s) queued for removal.`); } }}><UserMinus /> Remove all access</Button>
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      <AppDialog open={!!editing} app={editing?.app ?? null} onOpenChange={(open) => !open && setEditing(null)} onSubmit={async (input) => { const next = await run<AppsOverview>('/api/apps', 'PUT', input, 'App saved'); if (next) setData(next); return !!next; }} />
      <RequestDialog app={requesting} onOpenChange={(open) => !open && setRequesting(null)} onSubmit={async (input) => { const next = await run<AppsOverview>('/api/apps', 'POST', input, 'Request sent'); if (next) setData(next); return !!next; }} />
    </>
  );
}
