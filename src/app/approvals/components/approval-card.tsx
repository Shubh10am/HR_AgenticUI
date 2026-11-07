'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PersonAvatar from '@/components/person-avatar';
import StatusPill, { type PillTone } from '@/components/status-pill';
import ApprovalTimeline from '@/components/approvals/approval-timeline';
import { APPROVAL_KIND_LABEL, type ApprovalStatus, type ApprovalView } from '@/lib/approvals';
import { formatMoney } from '@/lib/expenses';

const STATUS: Record<ApprovalStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'In progress', tone: 'warn' },
  approved: { label: 'Approved', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'bad' },
  cancelled: { label: 'Withdrawn', tone: 'neutral' },
};

/** One approval request, with approve/reject when it waits on the viewer. */
export default function ApprovalCard({ approval, onDecide }: { approval: ApprovalView; onDecide: (decision: 'approve' | 'reject', comment: string) => Promise<boolean> }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const act = async (decision: 'approve' | 'reject') => {
    setBusy(decision);
    const ok = await onDecide(decision, comment);
    setBusy(null);
    if (ok) {
      setComment('');
      setRejecting(false);
    }
  };

  return (
    <Card id={`approval-${approval.id}`}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start gap-3">
          <PersonAvatar person={approval.requester} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{approval.title}</span>
              <StatusPill tone={STATUS[approval.status].tone}>{STATUS[approval.status].label}</StatusPill>
            </div>
            <p className="text-xs text-muted-foreground">
              {APPROVAL_KIND_LABEL[approval.kind]} · {approval.requester.name}
              {approval.requester.department ? ` · ${approval.requester.department}` : ''} · {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
            </p>
          </div>
          {approval.amount != null && approval.currency && <span className="font-display text-lg font-bold">{formatMoney(approval.amount, approval.currency)}</span>}
        </div>
        {approval.summary && <p className="text-sm text-muted-foreground">{approval.summary}</p>}
        <ApprovalTimeline approval={approval} />
        {approval.canDecide && (
          <div className="space-y-3 border-t pt-4">
            {rejecting && (
              <Textarea
                id={`approval-${approval.id}-comment`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Why is this being rejected? The requester will see this."
                rows={2}
                autoFocus
              />
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {rejecting ? (
                <>
                  <Button variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
                  <Button id={`approval-${approval.id}-reject-confirm`} variant="destructive" disabled={!comment.trim() || !!busy} onClick={() => void act('reject')}>
                    {busy === 'reject' ? <Loader2 className="animate-spin" /> : <X />} Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button id={`approval-${approval.id}-reject`} variant="outline" onClick={() => setRejecting(true)}>
                    <X /> Reject
                  </Button>
                  <Button id={`approval-${approval.id}-approve`} disabled={!!busy} onClick={() => void act('approve')}>
                    {busy === 'approve' ? <Loader2 className="animate-spin" /> : <Check />} Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
