'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Clock, Download, Loader2, Plus, Wallet } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatTile from '@/components/stat-tile';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgApi } from '@/hooks/use-org-api';
import { EXPENSE_STATUS_LABEL, formatMoney, type ExpenseView, type NewExpenseInput } from '@/lib/expenses';
import NewClaimDialog from './components/new-claim-dialog';
import ClaimsTable from './components/claims-table';

/** Totals per currency, e.g. "₹12,400 + $80". */
const totalOf = (claims: ExpenseView[]) => {
  const sums = new Map<string, number>();
  for (const claim of claims) sums.set(claim.currency, (sums.get(claim.currency) ?? 0) + claim.amount);
  return sums.size ? [...sums.entries()].map(([currency, amount]) => formatMoney(amount, currency)).join(' + ') : '—';
};

export default function ExpensesPage() {
  const { run, isGuest, authLoading, isPeopleTeam, role } = useOrgApi();
  const [mine, setMine] = useState<ExpenseView[] | null>(null);
  const [team, setTeam] = useState<ExpenseView[]>([]);
  const [all, setAll] = useState<ExpenseView[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (isGuest) return setMine([]);
    const [nextMine, nextTeam, nextAll] = await Promise.all([
      run<ExpenseView[]>('/api/expenses'),
      run<ExpenseView[]>('/api/expenses?scope=team'),
      isPeopleTeam ? run<ExpenseView[]>('/api/expenses?scope=all') : Promise.resolve([]),
    ]);
    setMine(nextMine ?? []);
    setTeam(nextTeam ?? []);
    setAll(nextAll ?? []);
    setSelected(new Set());
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const stats = useMemo(() => {
    const list = mine ?? [];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return {
      pending: list.filter((claim) => claim.status === 'submitted'),
      toBePaid: list.filter((claim) => claim.status === 'approved'),
      paid: list.filter((claim) => claim.status === 'paid' && claim.paidAt && new Date(claim.paidAt) >= monthStart),
    };
  }, [mine]);

  const submit = async (input: NewExpenseInput) => {
    const result = await run('/api/expenses', 'POST', input, 'Claim submitted for approval');
    if (result) await load();
    return !!result;
  };

  const openReceipt = async (id: string) => {
    const receipt = await run<{ name: string; data: string }>(`/api/expenses/${id}/receipt`);
    if (!receipt) return;
    const blob = await (await fetch(receipt.data)).blob();
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  };

  const withdraw = async (id: string) => {
    if (await run(`/api/expenses/${id}`, 'DELETE', undefined, 'Claim withdrawn')) await load();
  };

  const markPaid = async () => {
    const result = await run<{ updated: number }>('/api/expenses', 'PATCH', { ids: [...selected] }, `Marked ${selected.size} claim${selected.size === 1 ? '' : 's'} paid`);
    if (result) await load();
  };

  const exportCsv = () => {
    const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [
      ['Person', 'Department', 'Category', 'Where', 'Purpose', 'Date', 'Amount', 'Currency', 'Status', 'Paid on'],
      ...all.map((claim) => [
        claim.employee.name,
        claim.employee.department,
        claim.category,
        claim.merchant,
        claim.description,
        claim.spentOn.slice(0, 10),
        String(claim.amount),
        claim.currency,
        EXPENSE_STATUS_LABEL[claim.status],
        claim.paidAt?.slice(0, 10) ?? '',
      ]),
    ];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([lines.map((line) => line.map(cell).join(',')).join('\n')], { type: 'text/csv' }));
    link.download = `expense-claims-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const showTeam = team.length > 0 || role === 'Manager';

  return (
    <>
      <PageHeader title="Expenses" description="Claim work expenses, follow their approval and see when they're reimbursed.">
        <Button id="expense-new" onClick={() => setOpen(true)} disabled={isGuest}>
          <Plus /> New claim
        </Button>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="expenses" />}

      {!mine ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading claims…
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatTile id="expense-stat-pending" icon={Clock} label="Awaiting approval" value={totalOf(stats.pending)} hint={`${stats.pending.length} claims`} />
            <StatTile id="expense-stat-to-pay" icon={Wallet} label="Approved · to be paid" value={totalOf(stats.toBePaid)} hint={`${stats.toBePaid.length} claims`} />
            <StatTile id="expense-stat-paid" icon={BadgeCheck} label="Paid this month" value={totalOf(stats.paid)} hint={`${stats.paid.length} claims`} />
          </div>
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger id="expense-tab-mine" value="mine">My claims</TabsTrigger>
              {showTeam && <TabsTrigger id="expense-tab-team" value="team">My team</TabsTrigger>}
              {isPeopleTeam && <TabsTrigger id="expense-tab-all" value="all">All claims</TabsTrigger>}
            </TabsList>
            <TabsContent value="mine" className="mt-4">
              <ClaimsTable id="expense-mine-table" claims={mine} onReceipt={openReceipt} onWithdraw={withdraw} />
            </TabsContent>
            {showTeam && (
              <TabsContent value="team" className="mt-4">
                <p className="mb-3 text-sm text-muted-foreground">Claims from your direct reports. Approve them from Approvals.</p>
                <ClaimsTable id="expense-team-table" claims={team} showPerson onReceipt={openReceipt} />
              </TabsContent>
            )}
            {isPeopleTeam && (
              <TabsContent value="all" className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Tick approved claims and mark them paid once reimbursed.</p>
                  <div className="flex gap-2">
                    <Button id="expense-export" variant="outline" size="sm" onClick={exportCsv} disabled={all.length === 0}>
                      <Download /> CSV
                    </Button>
                    <Button id="expense-mark-paid" size="sm" disabled={selected.size === 0} onClick={() => void markPaid()}>
                      <BadgeCheck /> Mark {selected.size || ''} paid
                    </Button>
                  </div>
                </div>
                <ClaimsTable id="expense-all-table" claims={all} showPerson selectable selected={selected} onToggle={toggle} onReceipt={openReceipt} />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      <NewClaimDialog open={open} onOpenChange={setOpen} onSubmit={submit} />
    </>
  );
}
