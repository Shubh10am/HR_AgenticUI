'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RATING_LABELS, type ReviewView } from '@/lib/performance';
import { cn } from '@/lib/utils';

type Answers = Record<string, { rating?: number | null; text?: string }>;

function ReviewForm({ review, onSave, onCancel }: { review: ReviewView; onSave: (answers: Answers, submit: boolean) => Promise<boolean>; onCancel: () => void }) {
  const [answers, setAnswers] = useState<Answers>(Object.fromEntries(review.answers.map((answer) => [answer.key, { rating: answer.rating, text: answer.text }])));
  const [busy, setBusy] = useState<'save' | 'submit' | null>(null);
  const readOnly = !review.canWrite;
  const set = (key: string, change: { rating?: number; text?: string }) => setAnswers({ ...answers, [key]: { ...answers[key], ...change } });
  const save = async (submit: boolean) => {
    setBusy(submit ? 'submit' : 'save');
    await onSave(answers, submit);
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      {review.questions.map((question) => (
        <div key={question.key} className="space-y-2">
          <Label htmlFor={`review-${review.id}-${question.key}`}>{question.text}</Label>
          {question.kind === 'rating' ? (
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={question.text}>
              {RATING_LABELS.map((label, index) => {
                const value = index + 1;
                const active = answers[question.key]?.rating === value;
                return (
                  <button
                    key={label}
                    type="button"
                    id={`review-${review.id}-${question.key}-${value}`}
                    role="radio"
                    aria-checked={active}
                    disabled={readOnly}
                    onClick={() => set(question.key, { rating: value })}
                    className={cn('rounded-lg border px-1 py-2 text-center text-xs transition-colors', active ? 'border-primary bg-primary/10 font-semibold text-primary' : 'hover:border-primary/40', readOnly && 'cursor-default')}
                  >
                    <span className="block text-base font-bold">{value}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea id={`review-${review.id}-${question.key}`} rows={3} maxLength={4000} readOnly={readOnly} value={answers[question.key]?.text ?? ''} onChange={(event) => set(question.key, { text: event.target.value })} />
          )}
        </div>
      ))}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && (
          <>
            <Button id="review-save-draft" variant="outline" disabled={!!busy} onClick={() => void save(false)}>{busy === 'save' && <Loader2 className="animate-spin" />} Save draft</Button>
            <Button id="review-submit" disabled={!!busy} onClick={() => void save(true)}>{busy === 'submit' && <Loader2 className="animate-spin" />} {review.status === 'submitted' ? 'Update' : 'Submit'}</Button>
          </>
        )}
      </DialogFooter>
    </div>
  );
}

/** Write or read one review. */
export default function ReviewDialog({ review, onOpenChange, onSave }: { review: ReviewView | null; onOpenChange: (open: boolean) => void; onSave: (answers: Answers, submit: boolean) => Promise<boolean> }) {
  return (
    <Dialog open={!!review} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {review && (
          <>
            <DialogHeader>
              <DialogTitle>{review.type === 'self' ? (review.canWrite ? 'Your self review' : `${review.subject.name}'s self review`) : `Manager review of ${review.subject.name}`}</DialogTitle>
              <DialogDescription>
                {review.cycle.name}
                {review.type === 'manager' && review.canWrite ? ' · shared with them when the cycle closes. Base it on evidence and examples, not activity counts.' : ''}
              </DialogDescription>
            </DialogHeader>
            <ReviewForm review={review} onCancel={() => onOpenChange(false)} onSave={async (answers, submit) => { const ok = await onSave(answers, submit); if (ok && submit) onOpenChange(false); return ok; }} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
