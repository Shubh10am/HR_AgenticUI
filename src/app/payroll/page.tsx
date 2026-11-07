'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Banknote, FileText, Loader2, Pencil, PlayCircle, Send, Trash2, Users } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatTile from '@/components/stat-tile';
import StatusPill from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrgApi } from '@/hooks/use-org-api';
import type { PayRunView, PayslipView, PayStructureView } from '@/lib/payroll';
import PayslipDialog, { money, monthLabel } from './components/payslip-dialog';
import StructureDialog from './components/structure-dialog';

const lastMonth = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };

export default function PayrollPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [mine, setMine] = useState<PayslipView[] | null>(null);
  const [structures, setStructures] = useState<PayStructureView[]>([]);
  const [runs, setRuns] = useState<PayRunView[]>([]);
  const [viewing, setViewing] = useState<PayslipView | null>(null);
  const [editing, setEditing] = useState<PayStructureView | null>(null);
  const [openRun, setOpenRun] = useState<{ run: PayRunView; slips: PayslipView[] } | null>(null);
  const [month, setMonth] = useState(lastMonth());
  const [prorate, setProrate] = useState(true);

  const load = useCallback(async () => {
    if (isGuest) return setMine([]);
    const [slips, s, r] = await Promise.all([
      run<PayslipView[]>('/api/payroll/payslips'),
      isPeopleTeam ? run<PayStructureView[]>('/api/payroll/structures') : Promise.resolve([]),
      isPeopleTeam ? run<PayRunView[]>('/api/payroll/runs') : Promise.resolve([]),
    ]);
    setMine(slips ?? []);
    setStructures(s ?? []);
    setRuns(r ?? []);
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const showRun = async (payRun: PayRunView) => {
    const slips = await run<PayslipView[]>(`/api/payroll/runs/${payRun.id}`);
    if (slips) setOpenRun({ run: payRun, slips });
  };
  const configured = structures.filter((s) => s.components.length);
  const latest = mine?.[0];

  return (
    <>
      <PageHeader title="Payroll" description={isPeopleTeam ? 'Set each person’s monthly pay, prepare a month, check it and publish payslips.' : 'Your payslips, published by HR each month.'} />
      {isGuest && <GuestSampleNotice what="payslips" />}
      {!mine ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatTile id="payroll-latest" icon={Banknote} label="Latest net pay" value={latest ? money(latest.net, latest.currency) : '—'} hint={latest ? monthLabel(latest.month) : 'No payslips yet'} />
            {isPeopleTeam ? (
              <>
                <StatTile id="payroll-configured" icon={Users} label="People with pay set" value={`${configured.length} of ${structures.length}`} />
                <StatTile id="payroll-last-run" icon={FileText} label="Last pay run" value={runs[0] ? monthLabel(runs[0].month) : '—'} hint={runs[0] ? (runs[0].status === 'published' ? 'Published' : 'Draft — not visible yet') : undefined} />
              </>
            ) : (
              <StatTile id="payroll-count" icon={FileText} label="Payslips" value={mine.length} />
            )}
          </div>
          <Tabs defaultValue="mine">
            <TabsList>
              <TabsTrigger id="payroll-tab-mine" value="mine">My payslips</TabsTrigger>
              {isPeopleTeam && <TabsTrigger id="payroll-tab-runs" value="runs">Pay runs</TabsTrigger>}
              {isPeopleTeam && <TabsTrigger id="payroll-tab-pay" value="pay">People’s pay</TabsTrigger>}
            </TabsList>

            <TabsContent value="mine" className="mt-4 space-y-3">
              {mine.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No payslips yet. They appear here once HR publishes a month.</Card>}
              {mine.map((slip) => (
                <Card key={slip.id} id={`payslip-${slip.id}`}>
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1"><p className="font-semibold">{monthLabel(slip.month)}</p><p className="text-xs text-muted-foreground">Gross {money(slip.gross, slip.currency)} · Deductions {money(slip.deductions, slip.currency)}</p></div>
                    <span className="font-display text-lg font-bold">{money(slip.net, slip.currency)}</span>
                    <Button id={`payslip-${slip.id}-view`} variant="outline" size="sm" onClick={() => setViewing(slip)}>View</Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {isPeopleTeam && (
              <TabsContent value="runs" className="mt-4 space-y-4">
                <Card className="flex flex-wrap items-end gap-4 p-4">
                  <div className="space-y-1.5"><Label htmlFor="payroll-run-month">Month</Label><Input id="payroll-run-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
                  <div className="flex items-center gap-2 pb-2"><Switch id="payroll-run-prorate" checked={prorate} onCheckedChange={setProrate} /><Label htmlFor="payroll-run-prorate">Reduce earnings for approved unpaid leave</Label></div>
                  <Button id="payroll-run-prepare" className="ml-auto" disabled={!month || !configured.length} onClick={async () => { const r = await run<PayRunView>('/api/payroll/runs', 'POST', { month, prorateUnpaid: prorate }, 'Draft prepared — check it, then publish'); if (r) { await load(); await showRun(r); } }}><PlayCircle /> Prepare payslips</Button>
                </Card>
                {runs.length === 0 ? <Card className="p-10 text-center text-sm text-muted-foreground">No pay runs yet. Set people’s pay, then prepare a month.</Card> : (
                  <Card className="divide-y">
                    {runs.map((r) => (
                      <div key={r.id} id={`payroll-run-${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1"><p className="font-medium">{monthLabel(r.month)}</p><p className="text-xs text-muted-foreground">{r.employees} people · net {money(r.net, r.currency)}{r.publishedAt ? ` · published ${format(new Date(r.publishedAt), 'd MMM yyyy')}` : ''}</p></div>
                        <StatusPill tone={r.status === 'published' ? 'ok' : 'warn'}>{r.status === 'published' ? 'Published' : 'Draft'}</StatusPill>
                        <Button id={`payroll-run-${r.id}-open`} size="sm" variant="outline" onClick={() => void showRun(r)}>Check</Button>
                        {r.status === 'draft' && (
                          <>
                            <Button id={`payroll-run-${r.id}-delete`} size="icon" variant="ghost" aria-label="Delete draft" onClick={async () => { if (window.confirm('Delete this draft?')) { const next = await run<PayRunView[]>(`/api/payroll/runs/${r.id}`, 'DELETE', undefined, 'Draft deleted'); if (next) { setRuns(next); setOpenRun(null); } } }}><Trash2 /></Button>
                            <Button id={`payroll-run-${r.id}-publish`} size="sm" onClick={async () => { if (window.confirm(`Publish ${monthLabel(r.month)}? Everyone will see their payslip and it can’t be changed.`)) { if (await run(`/api/payroll/runs/${r.id}`, 'POST', undefined, 'Payslips published')) { await load(); setOpenRun(null); } } }}><Send /> Publish</Button>
                          </>
                        )}
                      </div>
                    ))}
                  </Card>
                )}
                {openRun && (
                  <Card id="payroll-run-detail">
                    <div className="flex items-center justify-between border-b px-4 py-3"><p className="font-semibold">{monthLabel(openRun.run.month)} · {openRun.slips.length} payslips</p><StatusPill tone={openRun.run.status === 'published' ? 'ok' : 'warn'}>{openRun.run.status === 'published' ? 'Published' : 'Draft'}</StatusPill></div>
                    <Table>
                      <TableHeader><TableRow><TableHead id="payroll-col-person">Person</TableHead><TableHead id="payroll-col-unpaid">Unpaid days</TableHead><TableHead id="payroll-col-gross" className="text-right">Gross</TableHead><TableHead id="payroll-col-deductions" className="text-right">Deductions</TableHead><TableHead id="payroll-col-net" className="text-right">Net</TableHead><TableHead /></TableRow></TableHeader>
                      <TableBody>
                        {openRun.slips.map((slip) => (
                          <TableRow key={slip.id} id={`payroll-slip-${slip.id}-row`}>
                            <TableCell><p className="font-medium">{slip.employee.name}</p><p className="text-xs text-muted-foreground">{slip.employee.department}</p></TableCell>
                            <TableCell>{slip.unpaidDays || '—'}</TableCell>
                            <TableCell className="text-right tabular-nums">{money(slip.gross, slip.currency)}</TableCell>
                            <TableCell className="text-right tabular-nums">{money(slip.deductions, slip.currency)}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{money(slip.net, slip.currency)}</TableCell>
                            <TableCell><Button id={`payroll-slip-${slip.id}-view`} size="sm" variant="ghost" onClick={() => setViewing(slip)}>View</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>
            )}

            {isPeopleTeam && (
              <TabsContent value="pay" className="mt-4">
                <Card>
                  <Table>
                    <TableHeader><TableRow><TableHead id="pay-col-person">Person</TableHead><TableHead id="pay-col-components">Components</TableHead><TableHead id="pay-col-gross" className="text-right">Gross</TableHead><TableHead id="pay-col-net" className="text-right">Net</TableHead><TableHead /></TableRow></TableHeader>
                    <TableBody>
                      {structures.map((s) => (
                        <TableRow key={s.employee.id} id={`pay-structure-${s.employee.id}-row`}>
                          <TableCell><p className="font-medium">{s.employee.name}</p><p className="text-xs text-muted-foreground">{[s.employee.jobTitle, s.employee.department].filter(Boolean).join(' · ')}</p></TableCell>
                          <TableCell>{s.components.length ? `${s.components.length} components` : <span className="text-muted-foreground">Not set</span>}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.components.length ? money(s.gross, s.currency) : '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.components.length ? money(s.net, s.currency) : '—'}</TableCell>
                          <TableCell><Button id={`pay-structure-${s.employee.id}-edit`} size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil /> {s.components.length ? 'Edit' : 'Set pay'}</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      <PayslipDialog slip={viewing} onOpenChange={(open) => !open && setViewing(null)} />
      <StructureDialog structure={editing} onOpenChange={(open) => !open && setEditing(null)} onSubmit={async (input) => { const next = await run<PayStructureView[]>('/api/payroll/structures', 'PUT', input, 'Pay saved'); if (next) setStructures(next); return !!next; }} />
    </>
  );
}
