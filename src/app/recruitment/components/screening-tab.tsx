'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, FileUp, Loader2, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { withAiRetry } from '../ai-retry';
import { screenCandidate } from '@/ai/flows/screen-candidate-flow';
import type { RecruitmentStore } from '../store';
import { extractResumeText } from '../resume-text';
import { SAMPLE_RESUMES } from '../sample-data';
import { RecommendationBadge, ScoreRing } from './score-badge';

interface QueueItem { name: string; status: 'waiting' | 'screening' | 'done' | 'failed'; message?: string }

export default function ScreeningTab({ store, token, onNext }: { store: RecruitmentStore; token: string | null; onNext: () => void }) {
  const { toast } = useToast();
  const role = store.activeRole!;
  const fileInput = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const busy = queue.some((q) => q.status === 'screening' || q.status === 'waiting');
  const hasJd = role.jobDescription.trim().length >= 50;

  // Screens one at a time so a long batch doesn't hit provider rate limits.
  const run = async (items: { name: string; getText: () => Promise<string> }[]) => {
    setQueue(items.map((i) => ({ name: i.name, status: 'waiting' })));
    for (let i = 0; i < items.length; i++) {
      setQueue((q) => q.map((x, j) => (j === i ? { ...x, status: 'screening' } : x)));
      try {
        const resumeText = await items[i].getText();
        const result = await withAiRetry(() => screenCandidate({ jobDescription: role.jobDescription, resumeText, authToken: token }));
        store.addCandidate(role.id, result, items[i].name);
        setQueue((q) => q.map((x, j) => (j === i ? { ...x, status: 'done' } : x)));
      } catch (error) {
        setQueue((q) => q.map((x, j) => (j === i ? { ...x, status: 'failed', message: (error as Error).message } : x)));
      }
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    if (files.length > 20) { toast({ title: 'Up to 20 resumes at a time', variant: 'destructive' }); return; }
    run(Array.from(files).map((f) => ({ name: f.name, getText: () => extractResumeText(f) })));
    if (fileInput.current) fileInput.current.value = '';
  };

  const ranked = [...role.candidates].sort((a, b) => b.matchScore - a.matchScore);
  const done = queue.filter((q) => q.status === 'done' || q.status === 'failed').length;

  if (!hasJd) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">Add a job description first. Screening compares every resume against it.</Card>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Add resumes</CardTitle>
          <CardDescription>Each resume is scored against “{role.details.title || 'this role'}”. Resume text is sent to your AI provider and not stored.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button type="button" id="screening-upload" disabled={busy} onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50">
            <FileUp className="h-8 w-8 text-primary" />
            <span className="font-medium">Drop resumes or click to upload</span>
            <span className="text-xs text-muted-foreground">PDF or TXT · up to 20 files · 5 MB each</span>
          </button>
          <input ref={fileInput} type="file" accept=".pdf,.txt" multiple hidden onChange={(e) => onFiles(e.target.files)} />

          <div className="grid gap-1.5">
            <Label htmlFor="screening-paste">Or paste one resume</Label>
            <Textarea id="screening-paste" value={pasted} onChange={(e) => setPasted(e.target.value)} className="min-h-[120px]" placeholder="Paste resume text…" />
            <div className="flex flex-wrap gap-2">
              <Button id="screening-paste-submit" size="sm" disabled={busy || pasted.trim().length < 50} onClick={() => { const t = pasted; setPasted(''); run([{ name: 'Pasted resume', getText: async () => t }]); }}>Screen pasted resume</Button>
              {SAMPLE_RESUMES.map((s, i) => (
                <Button key={s.label} id={`screening-sample-${i}`} size="sm" variant="outline" disabled={busy} onClick={() => run([{ name: s.label, getText: async () => s.text }])}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />{s.label.replace('Sample resume: ', 'Sample: ')}
                </Button>
              ))}
            </div>
          </div>

          {queue.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Screening {done}/{queue.length}</span>{!busy && <button className="hover:underline" onClick={() => setQueue([])}>Clear</button>}</div>
              <Progress value={(done / queue.length) * 100} className="h-1.5" />
              <ul className="space-y-1 text-xs">
                {queue.map((q, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {q.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : q.status === 'failed' ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : q.status === 'screening' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-3.5 w-3.5 rounded-full border" />}
                    <span className="truncate">{q.name}</span>{q.message && <span className="truncate text-destructive">· {q.message}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="flex gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            Scores weigh job-relevant evidence only and ignore name, age, gender and other personal details. They are a starting point, not a decision.
          </p>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Shortlist</CardTitle>
            <CardDescription>{ranked.length ? `${ranked.length} screened, highest match first.` : 'Screened candidates appear here.'}</CardDescription>
          </div>
          {ranked.length > 0 && <Button id="screening-next" variant="secondary" size="sm" onClick={onNext}>Open pipeline →</Button>}
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Upload resumes or try a sample to see how screening works.</p>
          ) : (
            <ul className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
              {ranked.map((c) => (
                <li key={c.id} id={`screening-candidate-${c.id}`} className="rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <ScoreRing score={c.matchScore} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{c.candidateLabel}</p>
                        <RecommendationBadge value={c.recommendation} />
                      </div>
                      <p className="text-xs text-muted-foreground">{[c.currentTitle, c.yearsExperience ? `${c.yearsExperience} yrs` : '', c.source].filter(Boolean).join(' · ')}</p>
                      <p className="mt-2 text-sm">{c.summary}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div><p className="mb-1 text-xs font-semibold text-green-600">Meets</p><ul className="space-y-0.5 text-xs">{c.matchedRequirements.slice(0, 5).map((m) => <li key={m}>✓ {m}</li>)}</ul></div>
                        <div><p className="mb-1 text-xs font-semibold text-red-600">Gaps</p><ul className="space-y-0.5 text-xs">{c.missingRequirements.length ? c.missingRequirements.slice(0, 5).map((m) => <li key={m}>✗ {m}</li>) : <li className="text-muted-foreground">None found</li>}</ul></div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
