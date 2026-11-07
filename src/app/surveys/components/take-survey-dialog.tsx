'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MIN_RESPONSES, SCALE_LABELS, type SurveyView } from '@/lib/surveys';
import { cn } from '@/lib/utils';

function Choice({ id, label, active, onClick }: { id: string; label: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button type="button" id={id} role="radio" aria-checked={active} onClick={onClick} className={cn('rounded-lg border px-2 py-2 text-center text-xs transition-colors', active ? 'border-primary bg-primary/10 font-semibold text-primary' : 'hover:border-primary/40')}>
      {label}
    </button>
  );
}

function SurveyForm({ survey, onSubmit, onCancel }: { survey: SurveyView; onSubmit: (answers: Record<string, string | number>) => Promise<boolean>; onCancel: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: string, value: string | number) => setAnswers({ ...answers, [key]: value });
  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Anonymous. Your answers are stored without your name or the time you answered, results only appear once {MIN_RESPONSES} people have responded, and
        free-text answers are shown in random order.
      </p>
      {survey.questions.map((question) => (
        <div key={question.key} className="space-y-2">
          <Label htmlFor={`survey-${survey.id}-${question.key}`}>{question.text}</Label>
          {question.kind === 'enps' && (
            <>
              <div className="grid grid-cols-11 gap-1" role="radiogroup" aria-label={question.text}>
                {Array.from({ length: 11 }, (_, score) => <Choice key={score} id={`survey-${survey.id}-${question.key}-${score}`} label={score} active={answers[question.key] === score} onClick={() => set(question.key, score)} />)}
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground"><span>Not likely</span><span>Very likely</span></div>
            </>
          )}
          {question.kind === 'scale' && (
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={question.text}>
              {SCALE_LABELS.map((label, index) => <Choice key={label} id={`survey-${survey.id}-${question.key}-${index + 1}`} label={label} active={answers[question.key] === index + 1} onClick={() => set(question.key, index + 1)} />)}
            </div>
          )}
          {question.kind === 'choice' && (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label={question.text}>
              {question.options?.map((option) => <Choice key={option} id={`survey-${survey.id}-${question.key}-${option}`} label={option} active={answers[question.key] === option} onClick={() => set(question.key, option)} />)}
            </div>
          )}
          {question.kind === 'text' && (
            <Textarea id={`survey-${survey.id}-${question.key}`} rows={3} maxLength={2000} value={String(answers[question.key] ?? '')} onChange={(event) => set(question.key, event.target.value)} placeholder="Optional — avoid details that identify you or others." />
          )}
        </div>
      ))}
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          id="survey-submit"
          disabled={busy || Object.keys(answers).length === 0}
          onClick={async () => {
            setBusy(true);
            await onSubmit(answers);
            setBusy(false);
          }}
        >
          {busy && <Loader2 className="animate-spin" />} Submit anonymously
        </Button>
      </DialogFooter>
    </div>
  );
}

/** Answer a survey. */
export default function TakeSurveyDialog({ survey, onOpenChange, onSubmit }: { survey: SurveyView | null; onOpenChange: (open: boolean) => void; onSubmit: (answers: Record<string, string | number>) => Promise<boolean> }) {
  return (
    <Dialog open={!!survey} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {survey && (
          <>
            <DialogHeader>
              <DialogTitle>{survey.title}</DialogTitle>
              {survey.description && <DialogDescription>{survey.description}</DialogDescription>}
            </DialogHeader>
            <SurveyForm survey={survey} onCancel={() => onOpenChange(false)} onSubmit={async (answers) => { const ok = await onSubmit(answers); if (ok) onOpenChange(false); return ok; }} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
