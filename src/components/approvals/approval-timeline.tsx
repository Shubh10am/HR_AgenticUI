import { format } from 'date-fns';
import { Check, Circle, Clock, MinusCircle, X } from 'lucide-react';
import type { ApprovalView, StepStatus } from '@/lib/approvals';
import { cn } from '@/lib/utils';

const ICON: Record<StepStatus, { icon: typeof Check; tone: string; label: string }> = {
  approved: { icon: Check, tone: 'bg-emerald-500 text-white', label: 'Approved' },
  rejected: { icon: X, tone: 'bg-rose-500 text-white', label: 'Rejected' },
  pending: { icon: Clock, tone: 'bg-amber-400 text-white', label: 'Waiting' },
  waiting: { icon: Circle, tone: 'bg-muted text-muted-foreground', label: 'Next' },
  skipped: { icon: MinusCircle, tone: 'bg-muted text-muted-foreground', label: 'Not needed' },
};

/** The steps of an approval, with who decided and when. */
export default function ApprovalTimeline({ approval, compact }: { approval: ApprovalView; compact?: boolean }) {
  return (
    <ol className={cn('flex gap-2', compact ? 'flex-wrap items-center' : 'flex-col')}>
      {approval.steps.map((step, index) => {
        const meta = ICON[step.status];
        return (
          <li key={index} className={cn('flex items-start gap-2 text-sm', compact && 'items-center')}>
            <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', meta.tone, compact && 'mt-0')}>
              <meta.icon className="h-3 w-3" />
            </span>
            <span className="min-w-0">
              <span className="font-medium">{step.assigneeName ?? step.label}</span>
              <span className="text-muted-foreground">
                {' · '}
                {meta.label}
                {step.decidedByName && step.status !== 'pending' ? ` by ${step.decidedByName}` : ''}
                {!compact && step.decidedAt ? ` · ${format(new Date(step.decidedAt), 'd MMM, p')}` : ''}
              </span>
              {!compact && step.comment && <span className="mt-0.5 block text-xs italic text-muted-foreground">&ldquo;{step.comment}&rdquo;</span>}
            </span>
            {compact && index < approval.steps.length - 1 && <span className="text-muted-foreground">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
