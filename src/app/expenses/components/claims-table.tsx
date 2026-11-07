'use client';

import { format } from 'date-fns';
import { Paperclip, Undo2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StatusPill, { type PillTone } from '@/components/status-pill';
import ApprovalTimeline from '@/components/approvals/approval-timeline';
import { EXPENSE_STATUS_LABEL, formatMoney, type ExpenseStatus, type ExpenseView } from '@/lib/expenses';

const TONE: Record<ExpenseStatus, PillTone> = { submitted: 'warn', approved: 'info', rejected: 'bad', paid: 'ok', withdrawn: 'neutral' };

interface Props {
  id: string;
  claims: ExpenseView[];
  showPerson?: boolean;
  selectable?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  onReceipt: (id: string) => void;
  onWithdraw?: (id: string) => void;
}

/** A list of expense claims with their approval progress. */
export default function ClaimsTable({ id, claims, showPerson, selectable, selected, onToggle, onReceipt, onWithdraw }: Props) {
  if (claims.length === 0) return <Card className="p-10 text-center text-sm text-muted-foreground">No claims here yet.</Card>;
  return (
    <Card className="overflow-x-auto">
      <Table id={id}>
        <TableHeader>
          <TableRow>
            {selectable && <TableHead className="w-10" />}
            {showPerson && <TableHead id={`${id}-person-header`}>Person</TableHead>}
            <TableHead id={`${id}-claim-header`}>Claim</TableHead>
            <TableHead id={`${id}-date-header`}>Date</TableHead>
            <TableHead id={`${id}-amount-header`} className="text-right">Amount</TableHead>
            <TableHead id={`${id}-status-header`}>Status</TableHead>
            <TableHead id={`${id}-approval-header`}>Approval</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id} id={`${id}-${claim.id}-row`}>
              {selectable && (
                <TableCell>
                  {claim.status === 'approved' && <Checkbox id={`${id}-${claim.id}-select`} checked={selected?.has(claim.id)} onCheckedChange={() => onToggle?.(claim.id)} aria-label={`Select claim from ${claim.employee.name}`} />}
                </TableCell>
              )}
              {showPerson && (
                <TableCell>
                  <p className="font-medium">{claim.employee.name}</p>
                  <p className="text-xs text-muted-foreground">{claim.employee.department}</p>
                </TableCell>
              )}
              <TableCell>
                <p className="font-medium">{claim.merchant}</p>
                <p className="text-xs text-muted-foreground">{claim.category}{claim.description ? ` · ${claim.description}` : ''}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap">{format(new Date(claim.spentOn), 'd MMM yyyy')}</TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold">{formatMoney(claim.amount, claim.currency)}</TableCell>
              <TableCell>
                <StatusPill tone={TONE[claim.status]}>{EXPENSE_STATUS_LABEL[claim.status]}</StatusPill>
                {claim.paidAt && <p className="mt-1 text-xs text-muted-foreground">{format(new Date(claim.paidAt), 'd MMM')}</p>}
              </TableCell>
              <TableCell className="min-w-[220px]">{claim.approval ? <ApprovalTimeline approval={claim.approval} compact /> : '—'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {claim.hasReceipt && (
                    <Button id={`${id}-${claim.id}-receipt`} variant="ghost" size="icon" aria-label="View receipt" onClick={() => onReceipt(claim.id)}>
                      <Paperclip />
                    </Button>
                  )}
                  {onWithdraw && claim.mine && claim.status === 'submitted' && (
                    <Button id={`${id}-${claim.id}-withdraw`} variant="ghost" size="icon" aria-label="Withdraw claim" onClick={() => onWithdraw(claim.id)}>
                      <Undo2 />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
