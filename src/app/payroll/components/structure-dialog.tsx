'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPONENT_PRESETS, totals, type PayComponent, type PayStructureView } from '@/lib/payroll';
import { money } from './payslip-dialog';

type Submit = (input: Record<string, unknown>) => Promise<boolean>;

function StructureForm({ structure, onSubmit, onDone }: { structure: PayStructureView; onSubmit: Submit; onDone: () => void }) {
  const [currency, setCurrency] = useState(structure.currency);
  const [rows, setRows] = useState<PayComponent[]>(structure.components.length ? structure.components : COMPONENT_PRESETS.slice(0, 3));
  const [busy, setBusy] = useState(false);
  const set = (i: number, patch: Partial<PayComponent>) => setRows((current) => current.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const sum = totals(rows.map((r) => ({ ...r, amount: Number(r.amount) || 0 })));
  const validCurrency = /^[A-Z]{3}$/.test(currency);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await onSubmit({ employeeId: structure.employee.id, currency, components: rows.map((r) => ({ ...r, amount: Number(r.amount) || 0 })) });
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <div className="w-32 space-y-1.5"><Label htmlFor="pay-currency">Currency</Label><Input id="pay-currency" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <Input id={`pay-component-${i}-name`} aria-label="Component name" className="flex-1" value={row.name} maxLength={60} onChange={(e) => set(i, { name: e.target.value })} />
            <Select value={row.type} onValueChange={(type) => set(i, { type: type as PayComponent['type'] })}>
              <SelectTrigger id={`pay-component-${i}-type`} aria-label="Type" className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent>
            </Select>
            <Input id={`pay-component-${i}-amount`} aria-label="Monthly amount" className="w-36" type="number" min={0} step="0.01" value={row.amount} onChange={(e) => set(i, { amount: e.target.value as unknown as number })} />
            <Button id={`pay-component-${i}-remove`} type="button" variant="ghost" size="icon" aria-label="Remove component" onClick={() => setRows((current) => current.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
        ))}
        <Button id="pay-component-add" type="button" variant="outline" size="sm" onClick={() => setRows((current) => [...current, { name: '', type: 'earning', amount: 0 }])}><Plus /> Add component</Button>
      </div>
      {validCurrency && (
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Gross</p><p className="font-semibold">{money(sum.gross, currency)}</p></div>
          <div><p className="text-xs text-muted-foreground">Deductions</p><p className="font-semibold">{money(sum.deductions, currency)}</p></div>
          <div><p className="text-xs text-muted-foreground">Net</p><p className="font-semibold">{money(sum.net, currency)}</p></div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Enter tax and statutory deductions as fixed amounts from your payroll adviser. The app doesn’t calculate any country’s tax.</p>
      <DialogFooter><Button id="pay-structure-save" type="submit" disabled={busy || !validCurrency || rows.length === 0}>Save pay</Button></DialogFooter>
    </form>
  );
}

export default function StructureDialog({ structure, onOpenChange, onSubmit }: { structure: PayStructureView | null; onOpenChange: (open: boolean) => void; onSubmit: Submit }) {
  return (
    <Dialog open={!!structure} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Monthly pay · {structure?.employee.name}</DialogTitle><DialogDescription>Fixed monthly earnings and deductions used for every pay run.</DialogDescription></DialogHeader>
        {structure && <StructureForm structure={structure} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
