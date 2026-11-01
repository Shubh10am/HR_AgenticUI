'use client';

import { useState } from 'react';
import { ClipboardList, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { STAGES, STAGE_LABELS, type Candidate, type RecruitmentStore, type Stage } from '../store';
import { RecommendationBadge, ScoreRing } from './score-badge';

const STAGE_TONE: Record<Stage, string> = {
  screened: 'border-t-slate-400', interview: 'border-t-blue-500', offer: 'border-t-violet-500', hired: 'border-t-green-500', declined: 'border-t-red-400',
};

export default function PipelineTab({ store, onInterviewKit }: { store: RecruitmentStore; onInterviewKit: (candidateId: string) => void }) {
  const role = store.activeRole!;
  const [openId, setOpenId] = useState<string | null>(null);
  const open = role.candidates.find((c) => c.id === openId) ?? null;
  const move = (c: Candidate, stage: Stage) => store.updateCandidate(role.id, c.id, { stage });

  if (role.candidates.length === 0) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">No candidates yet. Screen some resumes and they’ll land in “Screened”.</Card>;
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const items = role.candidates.filter((c) => c.stage === stage).sort((a, b) => b.matchScore - a.matchScore);
          return (
            <div key={stage} id={`pipeline-column-${stage}`} className={cn('flex w-64 shrink-0 flex-col rounded-xl border border-t-4 bg-secondary/30', STAGE_TONE[stage])}>
              <div className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold">{STAGE_LABELS[stage]}<span className="rounded-full bg-background px-2 text-xs text-muted-foreground">{items.length}</span></div>
              <div className="max-h-[560px] space-y-2 overflow-y-auto px-2 pb-2">
                {items.map((c) => (
                  <button key={c.id} id={`pipeline-candidate-${c.id}`} type="button" onClick={() => setOpenId(c.id)}
                    className="w-full rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-2">
                      <ScoreRing score={c.matchScore} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.candidateLabel}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.currentTitle || '—'}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between"><RecommendationBadge value={c.recommendation} />{c.recruiterNotes && <span className="text-[10px] text-muted-foreground">has notes</span>}</div>
                  </button>
                ))}
                {items.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3"><ScoreRing score={open.matchScore} />{open.candidateLabel}</SheetTitle>
                <SheetDescription>{[open.currentTitle, open.yearsExperience ? `${open.yearsExperience} years` : '', open.source].filter(Boolean).join(' · ')}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5 text-sm">
                <div className="grid gap-1.5">
                  <Label htmlFor="pipeline-stage">Stage</Label>
                  <Select value={open.stage} onValueChange={(v) => move(open, v as Stage)}>
                    <SelectTrigger id="pipeline-stage"><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><p className="mb-1 font-semibold">AI summary <RecommendationBadge value={open.recommendation} /></p><p className="text-muted-foreground">{open.summary}</p></div>
                <div><p className="mb-1 font-semibold text-green-600">Meets</p><ul className="list-disc space-y-0.5 pl-5">{open.matchedRequirements.map((m) => <li key={m}>{m}</li>)}</ul></div>
                <div><p className="mb-1 font-semibold text-red-600">Gaps</p><ul className="list-disc space-y-0.5 pl-5">{open.missingRequirements.length ? open.missingRequirements.map((m) => <li key={m}>{m}</li>) : <li>None found</li>}</ul></div>
                <div><p className="mb-1 font-semibold">Ask about</p><ul className="list-disc space-y-0.5 pl-5">{open.followUpQuestions.map((q) => <li key={q}>{q}</li>)}</ul></div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pipeline-notes">Your notes</Label>
                  <Textarea id="pipeline-notes" value={open.recruiterNotes} onChange={(e) => store.updateCandidate(role.id, open.id, { recruiterNotes: e.target.value })} placeholder="Phone screen went well, available in 30 days…" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button id="pipeline-interview-kit" onClick={() => { onInterviewKit(open.id); setOpenId(null); }}><ClipboardList className="mr-1.5 h-4 w-4" />Interview kit</Button>
                  <Button id="pipeline-remove" variant="ghost" className="text-destructive" onClick={() => { store.removeCandidate(role.id, open.id); setOpenId(null); }}><Trash2 className="mr-1.5 h-4 w-4" />Remove</Button>
                </div>
                <p className="text-xs text-muted-foreground">AI scores are advisory. Make decisions on interviews and your own judgement.</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
