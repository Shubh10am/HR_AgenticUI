'use client';

import { useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { CheckCircle2, Circle, Lock, Loader2, Undo2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PersonAvatar from '@/components/person-avatar';
import StatusPill, { type PillTone } from '@/components/status-pill';
import ApprovalTimeline from '@/components/approvals/approval-timeline';
import { EXIT_QUESTIONS, OFFBOARDING_STATUS_LABEL, type OffboardingStatus, type OffboardingView } from '@/lib/offboarding';
import { cn } from '@/lib/utils';

const TONE: Record<OffboardingStatus, PillTone> = { 'pending-approval': 'warn', 'in-progress': 'info', completed: 'ok', withdrawn: 'neutral', rejected: 'bad' };

function ExitInterviewForm({ onSubmit }: { onSubmit: (answers: Record<string, string>) => Promise<boolean> }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="h-4 w-4" /> Exit feedback — seen by HR and admins only, not your manager
      </p>
      {EXIT_QUESTIONS.map((question) => (
        <div key={question.key} className="space-y-1.5">
          <Label htmlFor={`exit-interview-${question.key}`}>{question.label}</Label>
          <Textarea id={`exit-interview-${question.key}`} rows={2} maxLength={2000} value={answers[question.key] ?? ''} onChange={(event) => setAnswers({ ...answers, [question.key]: event.target.value })} />
        </div>
      ))}
      <div className="flex justify-end">
        <Button
          id="exit-interview-submit"
          disabled={busy || !Object.values(answers).some((answer) => answer.trim())}
          onClick={async () => {
            setBusy(true);
            await onSubmit(answers);
            setBusy(false);
          }}
        >
          {busy && <Loader2 className="animate-spin" />} Share feedback
        </Button>
      </div>
    </div>
  );
}

interface Props {
  item: OffboardingView;
  canWithdraw: boolean;
  onTick: (key: string, done: boolean) => void;
  onWithdraw: () => void;
  onExitInterview: (answers: Record<string, string>) => Promise<boolean>;
}

/** One exit: dates, approval, the checklist, and the confidential exit feedback. */
export default function ExitCase({ item, canWithdraw, onTick, onWithdraw, onExitInterview }: Props) {
  const daysLeft = differenceInCalendarDays(new Date(item.lastWorkingDay), new Date());
  const open = item.status === 'pending-approval' || item.status === 'in-progress';
  return (
    <Card id={`exit-${item.id}`}>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start gap-3">
          <PersonAvatar person={item.employee} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{item.employee.name}</span>
              <StatusPill tone={TONE[item.status]}>{OFFBOARDING_STATUS_LABEL[item.status]}</StatusPill>
            </div>
            <p className="text-xs text-muted-foreground">
              {[item.employee.jobTitle, item.employee.department].filter(Boolean).join(' · ')} · {item.reason} · notice {format(new Date(item.noticeGivenOn), 'd MMM yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last working day</p>
            <p className="font-semibold">{format(new Date(item.lastWorkingDay), 'EEE, d MMM yyyy')}</p>
            {open && <p className="text-xs text-muted-foreground">{daysLeft > 0 ? `${daysLeft} days to go` : daysLeft === 0 ? 'Today' : `${-daysLeft} days ago`}</p>}
          </div>
        </div>
        {item.note && <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{item.note}</p>}
        {item.approval && item.status === 'pending-approval' && <ApprovalTimeline approval={item.approval} />}

        {item.status !== 'pending-approval' && item.status !== 'rejected' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Progress value={item.progress} className="h-2 flex-1" />
              <span className="text-sm font-semibold">{item.progress}%</span>
            </div>
            <ul className="divide-y rounded-xl border">
              {item.checklist.map((step) => (
                <li key={step.key} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    id={`exit-${item.id}-check-${step.key}`}
                    disabled={!step.canTick}
                    onClick={() => onTick(step.key, !step.done)}
                    aria-label={step.done ? `Mark "${step.label}" not done` : `Mark "${step.label}" done`}
                    className={cn('shrink-0', step.canTick ? 'cursor-pointer' : 'cursor-default opacity-70')}
                  >
                    {step.done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', step.done && 'text-muted-foreground line-through')}>{step.label}</p>
                    {step.doneByName && <p className="text-xs text-muted-foreground">{step.doneByName} · {format(new Date(step.doneAt!), 'd MMM')}</p>}
                  </div>
                  <StatusPill tone="neutral">{step.owner}</StatusPill>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.assets.length > 0 && open && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 px-4 py-3 text-sm dark:bg-amber-500/10">
            <p className="font-semibold">Equipment still assigned</p>
            <ul className="mt-1 text-muted-foreground">{item.assets.map((asset) => <li key={asset.tag}>{asset.tag} · {asset.name} ({asset.category})</li>)}</ul>
          </div>
        )}
        {item.apps.length > 0 && open && (
          <div id={`offboarding-${item.id}-apps`} className="rounded-xl border border-amber-300/60 bg-amber-50/60 px-4 py-3 text-sm dark:bg-amber-500/10">
            <p className="font-semibold">App access to remove</p>
            <ul className="mt-1 text-muted-foreground">{item.apps.map((app) => <li key={app.name}>{app.name} · {app.status}</li>)}</ul>
            <p className="mt-1 text-xs text-muted-foreground">HR can create removal tasks for all of these from the Apps page.</p>
          </div>
        )}
        {item.mine && open && !item.exitInterviewSubmitted && <ExitInterviewForm onSubmit={onExitInterview} />}
        {item.mine && item.exitInterviewSubmitted && <p className="text-sm text-muted-foreground">Thanks — your exit feedback has been shared with HR.</p>}
        {item.exitInterview && (
          <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4" /> Exit feedback (HR and admins only)</p>
            {item.exitInterview.filter((answer) => answer.answer).map((answer) => (
              <div key={answer.key}>
                <p className="text-xs font-medium text-muted-foreground">{answer.label}</p>
                <p className="text-sm">{answer.answer}</p>
              </div>
            ))}
          </div>
        )}
        {canWithdraw && open && (
          <div className="flex justify-end">
            <Button id={`exit-${item.id}-withdraw`} variant="outline" size="sm" onClick={onWithdraw}>
              <Undo2 /> {item.mine ? 'Withdraw resignation' : 'Cancel exit'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
