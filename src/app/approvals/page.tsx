'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Inbox, Loader2 } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useOrgApi } from '@/hooks/use-org-api';
import { APPROVAL_KINDS, type ApprovalKind, type ApprovalView, type PolicyStep } from '@/lib/approvals';
import ApprovalCard from './components/approval-card';
import PolicyEditor from './components/policy-editor';

interface Inbox {
  waiting: ApprovalView[];
  mine: ApprovalView[];
  decided: ApprovalView[];
  open: ApprovalView[];
}

function List({ items, empty, onDecide }: { items: ApprovalView[]; empty: string; onDecide: (id: string, decision: 'approve' | 'reject', comment: string) => Promise<boolean> }) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
        <CheckCircle2 className="h-8 w-8" />
        <p>{empty}</p>
      </Card>
    );
  }
  return <div className="space-y-4">{items.map((item) => <ApprovalCard key={item.id} approval={item} onDecide={(decision, comment) => onDecide(item.id, decision, comment)} />)}</div>;
}

export default function ApprovalsPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [policies, setPolicies] = useState<Record<ApprovalKind, PolicyStep[]> | null>(null);

  const load = useCallback(async () => {
    if (isGuest) return setInbox({ waiting: [], mine: [], decided: [], open: [] });
    const [nextInbox, nextPolicies] = await Promise.all([run<Inbox>('/api/approvals'), run<Record<ApprovalKind, PolicyStep[]>>('/api/approvals/policies')]);
    setInbox({ waiting: [], mine: [], decided: [], open: [], ...nextInbox });
    setPolicies(nextPolicies);
  }, [isGuest, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const decide = async (id: string, decision: 'approve' | 'reject', comment: string) => {
    const result = await run(`/api/approvals/${id}`, 'POST', { decision, comment }, decision === 'approve' ? 'Approved' : 'Rejected');
    if (result) await load();
    return !!result;
  };

  return (
    <>
      <PageHeader title="Approvals" description="Requests waiting on you, the ones you've raised, and the rules that route them." />
      {isGuest && <GuestSampleNotice what="approvals" />}
      {!inbox ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading approvals…
        </div>
      ) : (
        <Tabs defaultValue="waiting">
          <TabsList>
            <TabsTrigger id="approvals-tab-waiting" value="waiting">
              <Inbox className="mr-1.5 h-4 w-4" /> Waiting on me {inbox.waiting.length > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{inbox.waiting.length}</span>}
            </TabsTrigger>
            <TabsTrigger id="approvals-tab-mine" value="mine">My requests</TabsTrigger>
            <TabsTrigger id="approvals-tab-decided" value="decided">Decided by me</TabsTrigger>
            {isPeopleTeam && <TabsTrigger id="approvals-tab-open" value="open">All open ({inbox.open.length})</TabsTrigger>}
            {isPeopleTeam && <TabsTrigger id="approvals-tab-rules" value="rules">Rules</TabsTrigger>}
          </TabsList>
          <TabsContent value="waiting" className="mt-4">
            <List items={inbox.waiting} empty="Nothing is waiting on you. 🎉" onDecide={decide} />
          </TabsContent>
          <TabsContent value="mine" className="mt-4">
            <List items={inbox.mine} empty="You haven't raised any requests yet." onDecide={decide} />
          </TabsContent>
          <TabsContent value="decided" className="mt-4">
            <List items={inbox.decided} empty="You haven't decided any requests yet." onDecide={decide} />
          </TabsContent>
          {isPeopleTeam && (
            <TabsContent value="open" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Every request still in progress. Admins can step in when a manager is unavailable.</p>
              <List items={inbox.open} empty="No requests are open." onDecide={decide} />
            </TabsContent>
          )}
          {isPeopleTeam && policies && (
            <TabsContent value="rules" className="mt-4 grid gap-4 lg:grid-cols-2">
              {APPROVAL_KINDS.map((kind) => (
                <PolicyEditor
                  key={kind}
                  kind={kind}
                  initial={policies[kind]}
                  onSave={async (steps) => !!(await run('/api/approvals/policies', 'PUT', { kind, steps }, 'Approval rules saved'))}
                />
              ))}
            </TabsContent>
          )}
        </Tabs>
      )}
    </>
  );
}
