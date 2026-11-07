'use client';

import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { storedDateOf } from '@/lib/attendance';
import type { PayslipView } from '@/lib/payroll';

export const money = (amount: number, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
export const monthLabel = (month: string) => format(storedDateOf(`${month}-01`), 'MMMM yyyy');

function Slip({ slip }: { slip: PayslipView }) {
  const rows = (type: 'earning' | 'deduction') => slip.lines.filter((l) => l.type === type);
  return (
    <div id="payslip-print" className="space-y-5 text-sm">
      <div className="flex flex-wrap justify-between gap-2 border-b pb-3">
        <div><p className="font-semibold">{slip.employee.name}</p><p className="text-muted-foreground">{[slip.employee.jobTitle, slip.employee.department].filter(Boolean).join(' · ')}</p></div>
        <div className="text-right"><p className="font-semibold">Payslip · {monthLabel(slip.month)}</p><p className="text-muted-foreground">{slip.workingDays} working days{slip.unpaidDays ? ` · ${slip.unpaidDays} unpaid` : ''}</p></div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {(['earning', 'deduction'] as const).map((type) => (
          <div key={type}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{type === 'earning' ? 'Earnings' : 'Deductions'}</p>
            {rows(type).length === 0 && <p className="text-muted-foreground">None</p>}
            {rows(type).map((line) => <div key={line.name} className="flex justify-between py-1"><span>{line.name}</span><span className="tabular-nums">{money(line.amount, slip.currency)}</span></div>)}
            <div className="mt-1 flex justify-between border-t pt-1 font-medium"><span>Total</span><span className="tabular-nums">{money(type === 'earning' ? slip.gross : slip.deductions, slip.currency)}</span></div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3"><span className="font-semibold">Net pay</span><span className="font-display text-xl font-bold tabular-nums">{money(slip.net, slip.currency)}</span></div>
      <p className="text-xs text-muted-foreground">Amounts are set by your HR team. Contact HR if anything looks wrong.</p>
    </div>
  );
}

/** Opens the payslip in a clean window so it prints or saves as PDF without the app around it. */
function printSlip() {
  const node = document.getElementById('payslip-print');
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!node || !win) return;
  const styles = [...document.querySelectorAll('style,link[rel="stylesheet"]')].map((el) => el.outerHTML).join('');
  win.document.write(`<html><head><title>Payslip</title>${styles}</head><body class="p-10">${node.outerHTML}</body></html>`);
  win.document.close();
  win.setTimeout(() => win.print(), 400);
}

export default function PayslipDialog({ slip, onOpenChange }: { slip: PayslipView | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!slip} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Payslip</DialogTitle></DialogHeader>
        {slip && <Slip slip={slip} />}
        <div className="flex justify-end"><Button id="payslip-print-button" variant="outline" onClick={printSlip}><Printer /> Print or save PDF</Button></div>
      </DialogContent>
    </Dialog>
  );
}
