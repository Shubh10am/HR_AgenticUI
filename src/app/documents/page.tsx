'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, FileText, Loader2, Plus, ScrollText } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatusPill from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrgApi } from '@/hooks/use-org-api';
import type { AckStatusView, LetterView, PolicyDocView } from '@/lib/documents';
import PolicySheet from './components/policy-sheet';
import { LetterPreview, RequestLetterDialog } from './components/letter-dialogs';

export default function DocumentsPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [policies, setPolicies] = useState<PolicyDocView[] | null>(null);
  const [letters, setLetters] = useState<LetterView[]>([]);
  const [allLetters, setAllLetters] = useState<LetterView[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState<PolicyDocView | null>(null);
  const [requesting, setRequesting] = useState<'self' | 'other' | null>(null);
  const [preview, setPreview] = useState<LetterView | null>(null);
  const [newPolicy, setNewPolicy] = useState<{ title: string; body: string } | null>(null);

  const load = useCallback(async () => {
    if (isGuest) return setPolicies([]);
    const [nextPolicies, mine, all, org] = await Promise.all([
      run<PolicyDocView[]>('/api/documents/policies'),
      run<LetterView[]>('/api/documents/letters'),
      isPeopleTeam ? run<LetterView[]>('/api/documents/letters?scope=all') : Promise.resolve([]),
      isPeopleTeam ? run<{ people: { id: string; name: string }[] }>('/api/hierarchy') : Promise.resolve(null),
    ]);
    setPolicies(nextPolicies ?? []);
    setLetters(mine ?? []);
    setAllLetters(all ?? []);
    if (org) setPeople(org.people.map(({ id, name }) => ({ id, name })));
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const refreshPolicies = (next: PolicyDocView[] | null) => {
    if (!next) return false;
    setPolicies(next);
    setOpen((current) => (current ? next.find((item) => item.id === current.id) ?? null : null));
    return true;
  };
  const loadStatus = useCallback(() => (open ? run<AckStatusView>(`/api/documents/policies/${open.id}`) : Promise.resolve(null)), [open, run]);
  const toSign = (policies ?? []).filter((policy) => policy.requiresAck && !policy.myAck).length;

  const letterList = (list: LetterView[], manage: boolean) =>
    list.length === 0 ? (
      <Card className="p-10 text-center text-sm text-muted-foreground">No letters yet.</Card>
    ) : (
      <div className="space-y-3">
        {list.map((letter) => (
          <Card key={letter.id} id={`letter-${letter.id}`}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{letter.title}{manage ? ` · ${letter.employee.name}` : ''}</p>
                <p className="text-xs text-muted-foreground">
                  {letter.purpose ? `${letter.purpose} · ` : ''}{letter.issuedAt ? `issued ${format(new Date(letter.issuedAt), 'd MMM yyyy')} by ${letter.issuedByName}` : `requested ${format(new Date(letter.createdAt), 'd MMM yyyy')}`}
                </p>
              </div>
              <StatusPill tone={letter.status === 'issued' ? 'ok' : letter.status === 'requested' ? 'warn' : 'neutral'}>{letter.status === 'issued' ? 'Issued' : letter.status === 'requested' ? 'Requested' : 'Declined'}</StatusPill>
              {letter.status === 'issued' && <Button id={`letter-${letter.id}-view`} size="sm" variant="outline" onClick={() => setPreview(letter)}>View</Button>}
              {manage && letter.status === 'requested' && (
                <>
                  <Button id={`letter-${letter.id}-decline`} size="sm" variant="ghost" onClick={async () => { const next = await run<LetterView[]>(`/api/documents/letters/${letter.id}`, 'PATCH', { decision: 'decline' }, 'Request declined'); if (next) setAllLetters(next); }}>Decline</Button>
                  <Button id={`letter-${letter.id}-issue`} size="sm" onClick={async () => { const next = await run<LetterView[]>(`/api/documents/letters/${letter.id}`, 'PATCH', { decision: 'issue' }, 'Letter issued'); if (next) { setAllLetters(next); await load(); } }}>Issue</Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );

  return (
    <>
      <PageHeader title="Documents" description="Company policies to read and sign, and letters you can request from HR.">
        <div className="flex gap-2">
          {isPeopleTeam && <Button id="policy-new" variant="outline" onClick={() => setNewPolicy({ title: '', body: '' })} disabled={isGuest}><Plus /> New policy</Button>}
          <Button id="letter-request" onClick={() => setRequesting('self')} disabled={isGuest}><ScrollText /> Request a letter</Button>
        </div>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="documents" />}
      {!policies ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <Tabs defaultValue="policies">
          <TabsList>
            <TabsTrigger id="documents-tab-policies" value="policies">Policies {toSign > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{toSign}</span>}</TabsTrigger>
            <TabsTrigger id="documents-tab-letters" value="letters">My letters</TabsTrigger>
            {isPeopleTeam && <TabsTrigger id="documents-tab-all-letters" value="all-letters">Letter requests ({allLetters.filter((l) => l.status === 'requested').length})</TabsTrigger>}
          </TabsList>
          <TabsContent value="policies" className="mt-4">
            {policies.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">No policies published yet.</Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {policies.map((policy) => (
                  <Card key={policy.id} id={`policy-${policy.id}`} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setOpen(policy)}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start gap-2">
                        <p className="min-w-0 flex-1 font-semibold">{policy.title}</p>
                        {policy.requiresAck && (policy.myAck ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Signed</span> : <StatusPill tone="warn">To sign</StatusPill>)}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{policy.body}</p>
                      <p className="text-xs text-muted-foreground">Version {policy.version} · {format(new Date(policy.updatedAt), 'd MMM yyyy')}</p>
                      {policy.ackCount !== null && policy.headcount && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Progress value={(policy.ackCount / policy.headcount) * 100} className="h-1.5 flex-1" />
                          {policy.ackCount}/{policy.headcount} signed
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="letters" className="mt-4">{letterList(letters, false)}</TabsContent>
          {isPeopleTeam && (
            <TabsContent value="all-letters" className="mt-4 space-y-3">
              <div className="flex justify-end"><Button id="letter-issue" size="sm" variant="outline" onClick={() => setRequesting('other')}><Plus /> Issue a letter</Button></div>
              {letterList(allLetters, true)}
            </TabsContent>
          )}
        </Tabs>
      )}
      <PolicySheet
        policy={open}
        canManage={isPeopleTeam}
        onOpenChange={(value) => !value && setOpen(null)}
        loadStatus={loadStatus}
        onSign={async (signedName) => refreshPolicies(await run<PolicyDocView[]>(`/api/documents/policies/${open!.id}`, 'POST', { signedName }, 'Policy signed'))}
        onSave={async (input) => refreshPolicies(await run<PolicyDocView[]>(`/api/documents/policies/${open!.id}`, 'PUT', input, 'Policy saved'))}
      />
      <RequestLetterDialog
        open={requesting !== null}
        onOpenChange={(value) => !value && setRequesting(null)}
        people={requesting === 'other' ? people : null}
        onSubmit={async (input) => { const next = await run('/api/documents/letters', 'POST', input, requesting === 'other' ? 'Letter issued' : 'Letter requested from HR'); if (next) await load(); return !!next; }}
      />
      <LetterPreview letter={preview} onOpenChange={(value) => !value && setPreview(null)} />
      <Dialog open={!!newPolicy} onOpenChange={(value) => !value && setNewPolicy(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Publish a policy</DialogTitle></DialogHeader>
          <Input id="policy-new-title" placeholder="Title, e.g. Code of conduct" value={newPolicy?.title ?? ''} maxLength={120} onChange={(e) => setNewPolicy({ ...newPolicy!, title: e.target.value })} />
          <Textarea id="policy-new-body" rows={12} placeholder="Policy text" value={newPolicy?.body ?? ''} onChange={(e) => setNewPolicy({ ...newPolicy!, body: e.target.value })} />
          <p className="text-xs text-muted-foreground">Everyone is asked to read and sign it with their typed name.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewPolicy(null)}>Cancel</Button>
            <Button id="policy-new-submit" disabled={!newPolicy?.title.trim() || !newPolicy?.body.trim()} onClick={async () => { const next = await run<PolicyDocView[]>('/api/documents/policies', 'POST', newPolicy, 'Policy published'); if (next) { setPolicies(next); setNewPolicy(null); } }}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
