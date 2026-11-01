'use client';

import { useState } from 'react';
import { Copy, Loader2, Printer, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { withAiRetry } from '../ai-retry';
import { generateInterviewKit, type InterviewKitInput, type InterviewKitOutput } from '@/ai/flows/interview-kit-flow';
import type { RecruitmentStore } from '../store';

type Round = InterviewKitInput['rounds'][number];
const ROUNDS: { id: Round; label: string }[] = [
  { id: 'screening', label: 'Recruiter screen' }, { id: 'technical', label: 'Technical / skills' }, { id: 'behavioural', label: 'Behavioural' },
  { id: 'case-study', label: 'Case study / task review' }, { id: 'culture-values', label: 'Values & ways of working' }, { id: 'hiring-manager', label: 'Hiring manager' },
];
const NONE = 'none';

function kitAsText(kit: InterviewKitOutput): string {
  return kit.rounds.map((r) => `## ${r.name} (${r.durationMinutes} min)\nGoal: ${r.goal}\n\n${r.questions.map((q, i) => `${i + 1}. ${q.question}\n   Look for: ${q.lookFor}\n   Red flag: ${q.redFlag}`).join('\n')}`).join('\n\n')
    + `\n\n## Scorecard (rate 1–5)\n${kit.scorecard.map((s) => `- ${s.competency}: ${s.description}`).join('\n')}`;
}

export default function InterviewKitTab({ store, token, candidateId, onCandidateChange }: { store: RecruitmentStore; token: string | null; candidateId: string | null; onCandidateChange: (id: string | null) => void }) {
  const { toast } = useToast();
  const role = store.activeRole!;
  const [rounds, setRounds] = useState<Round[]>(['screening', 'technical', 'behavioural']);
  const [perRound, setPerRound] = useState('4');
  const [kit, setKit] = useState<InterviewKitOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const candidate = role.candidates.find((c) => c.id === candidateId) ?? null;

  const generate = async () => {
    if (role.jobDescription.trim().length < 50) { toast({ title: 'Add a job description first', variant: 'destructive' }); return; }
    if (!rounds.length) { toast({ title: 'Pick at least one round', variant: 'destructive' }); return; }
    setIsLoading(true);
    try {
      const candidateSummary = candidate
        ? `${candidate.summary}\nGaps to probe: ${candidate.missingRequirements.join('; ') || 'none'}\nSuggested questions: ${candidate.followUpQuestions.join('; ')}`
        : undefined;
      setKit(await withAiRetry(() => generateInterviewKit({ jobDescription: role.jobDescription, candidateSummary, rounds: ROUNDS.filter((r) => rounds.includes(r.id)).map((r) => r.id), questionsPerRound: Number(perRound), authToken: token })));
    } catch (error) {
      toast({ title: 'Could not build the kit', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="h-fit xl:col-span-2">
        <CardHeader>
          <CardTitle>Interview kit</CardTitle>
          <CardDescription>Structured questions, what good looks like, and a scorecard, so every interviewer assesses candidates the same way.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-1.5">
            <Label htmlFor="kit-candidate">Tailor to a candidate (optional)</Label>
            <Select value={candidateId ?? NONE} onValueChange={(v) => onCandidateChange(v === NONE ? null : v)}>
              <SelectTrigger id="kit-candidate"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Same kit for every candidate</SelectItem>
                {role.candidates.map((c) => <SelectItem key={c.id} value={c.id}>{c.candidateLabel} · {Math.round(c.matchScore)}</SelectItem>)}
              </SelectContent>
            </Select>
            {candidate && <p className="text-xs text-muted-foreground">Adds 1–2 questions to probe: {candidate.missingRequirements.slice(0, 3).join(', ') || 'no gaps found'}.</p>}
          </div>
          <div className="space-y-2">
            <Label>Rounds</Label>
            {ROUNDS.map((r) => (
              <label key={r.id} htmlFor={`kit-round-${r.id}`} className="flex items-center gap-2 text-sm">
                <Checkbox id={`kit-round-${r.id}`} checked={rounds.includes(r.id)} onCheckedChange={(on) => setRounds((prev) => (on ? [...prev, r.id] : prev.filter((x) => x !== r.id)).slice(0, 5))} />
                {r.label}
              </label>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="kit-per-round">Questions per round</Label>
            <Select value={perRound} onValueChange={setPerRound}>
              <SelectTrigger id="kit-per-round"><SelectValue /></SelectTrigger>
              <SelectContent>{['3', '4', '5', '6'].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button id="kit-generate" className="w-full" onClick={generate} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Build interview kit
          </Button>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>{candidate ? `Kit for ${candidate.candidateLabel}` : `Kit for ${role.details.title || 'this role'}`}</CardTitle>
            <CardDescription>Share with your interview panel before the interviews.</CardDescription>
          </div>
          {kit && (
            <div className="flex gap-1 print:hidden">
              <Button id="kit-copy" variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(kitAsText(kit)); toast({ title: 'Copied' }); }}><Copy className="mr-1.5 h-4 w-4" />Copy</Button>
              <Button id="kit-print" variant="ghost" size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" />Print</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!kit ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{isLoading ? 'Building your kit…' : 'Choose rounds and build the kit.'}</p>
          ) : (
            <div className="space-y-6">
              {kit.rounds.map((r, i) => (
                <section key={i} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{r.name}</h3><span className="text-xs text-muted-foreground">{r.durationMinutes} min</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.goal}</p>
                  <ol className="mt-3 space-y-3">
                    {r.questions.map((q, j) => (
                      <li key={j} className="text-sm">
                        <p className="font-medium">{j + 1}. {q.question}</p>
                        <p className="mt-1 text-xs"><span className="font-semibold text-green-600">Look for:</span> {q.lookFor}</p>
                        <p className="text-xs"><span className="font-semibold text-red-600">Red flag:</span> {q.redFlag}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
              <section className="rounded-xl border bg-secondary/30 p-4">
                <h3 className="font-semibold">Scorecard: rate each 1–5</h3>
                <ul className="mt-2 space-y-2 text-sm">{kit.scorecard.map((s) => <li key={s.competency}><span className="font-medium">{s.competency}</span>: <span className="text-muted-foreground">{s.description}</span></li>)}</ul>
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
