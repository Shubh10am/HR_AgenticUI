'use client';

import { useState } from 'react';
import { ArrowDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APPROVAL_KIND_LABEL, APPROVER_LABEL, type ApprovalKind, type ApproverType, type PolicyStep } from '@/lib/approvals';

/** Edits the approval chain for one kind of request. */
export default function PolicyEditor({ kind, initial, onSave }: { kind: ApprovalKind; initial: PolicyStep[]; onSave: (steps: PolicyStep[]) => Promise<boolean> }) {
  const [steps, setSteps] = useState<PolicyStep[]>(initial);
  const [busy, setBusy] = useState(false);
  const update = (index: number, change: Partial<PolicyStep>) => setSteps(steps.map((step, i) => (i === index ? { ...step, ...change } : step)));

  return (
    <Card id={`approval-policy-${kind}`}>
      <CardHeader>
        <CardTitle className="text-base">{APPROVAL_KIND_LABEL[kind]}</CardTitle>
        <CardDescription>
          Steps run in order; a rejection at any step ends the request. A manager step is skipped for people without a manager
          {kind === 'expense' ? ', and a step with a minimum only applies to claims of at least that amount' : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, index) => (
          <div key={index}>
            {index > 0 && <ArrowDown className="mx-auto my-1 h-4 w-4 text-muted-foreground" />}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
              <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{index + 1}</span>
              <Select value={step.approver} onValueChange={(value) => update(index, { approver: value as ApproverType })}>
                <SelectTrigger id={`approval-policy-${kind}-step-${index}-approver`} className="w-52" aria-label="Approver">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(APPROVER_LABEL) as ApproverType[]).map((approver) => (
                    <SelectItem key={approver} value={approver}>{APPROVER_LABEL[approver]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {kind === 'expense' && (
                <Input
                  id={`approval-policy-${kind}-step-${index}-min`}
                  type="number"
                  min={0}
                  className="w-48"
                  placeholder="Only from amount (optional)"
                  value={step.minAmount ?? ''}
                  onChange={(event) => update(index, { minAmount: event.target.value === '' ? null : Number(event.target.value) })}
                />
              )}
              {steps.length > 1 && (
                <Button variant="ghost" size="icon" className="ml-auto" aria-label={`Remove step ${index + 1}`} onClick={() => setSteps(steps.filter((_, i) => i !== index))}>
                  <Trash2 />
                </Button>
              )}
            </div>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          {steps.length < 5 ? (
            <Button id={`approval-policy-${kind}-add`} variant="outline" size="sm" onClick={() => setSteps([...steps, { approver: 'HR', minAmount: null }])}>
              <Plus /> Add step
            </Button>
          ) : (
            <span />
          )}
          <Button
            id={`approval-policy-${kind}-save`}
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onSave(steps);
              setBusy(false);
            }}
          >
            {busy && <Loader2 className="animate-spin" />} Save rules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
