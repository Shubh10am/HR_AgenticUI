'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LeaveTypePolicy } from '@/lib/leave';

/** HR and admins set allowances per leave type. */
export default function LeavePolicyEditor({ initial, onSave }: { initial: LeaveTypePolicy[]; onSave: (types: LeaveTypePolicy[]) => Promise<boolean> }) {
  const [types, setTypes] = useState(initial);
  const [busy, setBusy] = useState(false);
  const update = (index: number, change: Partial<LeaveTypePolicy>) => setTypes(types.map((type, i) => (i === index ? { ...type, ...change } : type)));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leave types and allowances</CardTitle>
        <CardDescription>Leave &ldquo;days per year&rdquo; empty for a type with no balance limit. Statutory leave such as maternity and paternity varies by country — set it to match the law where your people work.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="hidden grid-cols-[1fr_120px_120px_140px_60px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
          <span>Type</span><span>Days per year</span><span>Carry forward</span><span>Earned</span><span>On</span>
        </div>
        {types.map((type, index) => (
          <div key={type.type} className="grid grid-cols-2 items-center gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_120px_120px_140px_60px]">
            <span className="font-medium">{type.type}</span>
            <Input id={`leave-policy-${type.type}-days`} type="number" min={0} placeholder="No limit" value={type.annualDays ?? ''} onChange={(e) => update(index, { annualDays: e.target.value === '' ? null : Number(e.target.value) })} />
            <Input id={`leave-policy-${type.type}-carry`} type="number" min={0} value={type.carryForwardMax} disabled={type.annualDays === null} onChange={(e) => update(index, { carryForwardMax: Number(e.target.value) || 0 })} />
            <Select value={type.accrual} onValueChange={(value) => update(index, { accrual: value as LeaveTypePolicy['accrual'] })} disabled={type.annualDays === null}>
              <SelectTrigger id={`leave-policy-${type.type}-accrual`}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="upfront">All on 1 Jan</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
            </Select>
            <Switch id={`leave-policy-${type.type}-enabled`} checked={type.enabled} onCheckedChange={(enabled) => update(index, { enabled })} aria-label={`${type.type} enabled`} />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button id="leave-policy-save" disabled={busy} onClick={async () => { setBusy(true); await onSave(types); setBusy(false); }}>{busy && <Loader2 className="animate-spin" />} Save policy</Button>
        </div>
      </CardContent>
    </Card>
  );
}
