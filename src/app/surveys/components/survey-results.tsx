'use client';

import { EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MIN_RESPONSES, SCALE_LABELS, type QuestionResult, type SurveyResults } from '@/lib/surveys';

function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-xs">
          <span className="w-32 shrink-0 truncate text-muted-foreground">{row.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
          <span className="w-6 text-right font-semibold">{row.count}</span>
        </div>
      ))}
    </div>
  );
}

function Question({ result }: { result: QuestionResult }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{result.text}</CardTitle>
      </CardHeader>
      <CardContent>
        {result.kind === 'enps' && (
          <div className="space-y-3">
            <div className="flex items-end gap-4">
              <span className={`font-display text-4xl font-bold ${result.score >= 30 ? 'text-emerald-600' : result.score >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>{result.score > 0 ? `+${result.score}` : result.score}</span>
              <span className="pb-1 text-xs text-muted-foreground">eNPS · {result.promoters} promoters · {result.passives} passives · {result.detractors} detractors</span>
            </div>
            <div className="flex h-16 items-end gap-1">
              {result.distribution.map((count, score) => (
                <div key={score} className="flex flex-1 flex-col items-center gap-1">
                  <span className={`w-full rounded-t ${score >= 9 ? 'bg-emerald-500' : score >= 7 ? 'bg-slate-400' : 'bg-rose-400'}`} style={{ height: `${(count / Math.max(1, ...result.distribution)) * 48}px` }} />
                  <span className="text-[10px] text-muted-foreground">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {result.kind === 'scale' && (
          <div className="space-y-3">
            <p><span className="font-display text-3xl font-bold">{result.average}</span><span className="text-sm text-muted-foreground"> / 5</span></p>
            <Bars rows={result.distribution.map((count, index) => ({ label: SCALE_LABELS[index], count }))} />
          </div>
        )}
        {result.kind === 'choice' && <Bars rows={result.counts.map((row) => ({ label: row.option, count: row.count }))} />}
        {result.kind === 'text' && (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {result.answers.length === 0 && <li className="text-sm text-muted-foreground">No written answers.</li>}
            {result.answers.map((answer, index) => <li key={index} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{answer}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Aggregated, anonymous results with a department breakdown where groups are large enough. */
export default function SurveyResultsView({ results }: { results: SurveyResults }) {
  if (!results.visible) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <EyeOff className="h-8 w-8 text-muted-foreground" />
        <p className="font-semibold">Results are hidden until {MIN_RESPONSES} people respond</p>
        <p className="text-sm text-muted-foreground">{results.survey.responses} so far. This keeps every answer anonymous.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">{results.questions.map((question) => <Question key={question.key} result={question} />)}</div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">By department</CardTitle>
        </CardHeader>
        <CardContent>
          {results.byDepartment.length === 0 ? (
            <p className="text-sm text-muted-foreground">No department has {MIN_RESPONSES} or more responses yet, so none is shown on its own.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="pb-2">Department</th><th className="pb-2">Responses</th><th className="pb-2">eNPS</th><th className="pb-2">Average agreement</th></tr></thead>
              <tbody>
                {results.byDepartment.map((row) => (
                  <tr key={row.department} className="border-t"><td className="py-2 font-medium">{row.department}</td><td>{row.responses}</td><td>{row.enps ?? '—'}</td><td>{row.scaleAverage ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Groups with fewer than {MIN_RESPONSES} responses are left out.</p>
        </CardContent>
      </Card>
    </div>
  );
}
