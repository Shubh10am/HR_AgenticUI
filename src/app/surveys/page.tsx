'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, BarChart3, CheckCircle2, Loader2, Lock, Plus } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StatusPill from '@/components/status-pill';
import { useOrgApi } from '@/hooks/use-org-api';
import type { SurveyResults, SurveyView } from '@/lib/surveys';
import TakeSurveyDialog from './components/take-survey-dialog';
import CreateSurveyDialog, { type CreateSurveyInput } from './components/create-survey-dialog';
import SurveyResultsView from './components/survey-results';

export default function SurveysPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [surveys, setSurveys] = useState<SurveyView[] | null>(null);
  const [taking, setTaking] = useState<SurveyView | null>(null);
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<SurveyResults | null>(null);

  const load = useCallback(async () => {
    if (isGuest) return setSurveys([]);
    setSurveys((await run<SurveyView[]>('/api/surveys')) ?? []);
  }, [isGuest, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  if (results) {
    return (
      <>
        <PageHeader title={results.survey.title} description={`${results.survey.responses} anonymous responses · ${results.survey.status === 'open' ? 'still open' : 'closed'}`}>
          <Button id="survey-results-back" variant="outline" onClick={() => setResults(null)}><ArrowLeft /> All surveys</Button>
        </PageHeader>
        <SurveyResultsView results={results} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Pulse surveys" description="Short, anonymous check-ins on how people feel — eNPS, wellbeing and manager support.">
        {isPeopleTeam && <Button id="survey-new" onClick={() => setCreating(true)} disabled={isGuest}><Plus /> New survey</Button>}
      </PageHeader>
      {isGuest && <GuestSampleNotice what="surveys" />}
      {!surveys ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : surveys.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No surveys yet.{isPeopleTeam ? ' Start one from a template.' : ''}</Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {surveys.map((survey) => (
            <Card key={survey.id} id={`survey-${survey.id}`}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{survey.title}</p>
                    <p className="text-sm text-muted-foreground">{survey.description}</p>
                  </div>
                  <StatusPill tone={survey.status === 'open' ? 'info' : survey.status === 'draft' ? 'neutral' : 'ok'}>{survey.status === 'open' ? 'Open' : survey.status === 'draft' ? 'Draft' : 'Closed'}</StatusPill>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Progress value={survey.invited ? (survey.responses / survey.invited) * 100 : 0} className="h-1.5 flex-1" />
                  <span>{survey.responses}/{survey.invited} responded</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {survey.questions.length} questions
                  {survey.closesAt && survey.status === 'open' ? ` · closes ${formatDistanceToNow(new Date(survey.closesAt), { addSuffix: true })}` : ''}
                </p>
                <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                  {isPeopleTeam && (
                    <>
                      <Button id={`survey-${survey.id}-results`} variant="outline" size="sm" onClick={async () => { const next = await run<SurveyResults>(`/api/surveys/${survey.id}`); if (next) setResults(next); }}>
                        <BarChart3 /> Results
                      </Button>
                      {survey.status === 'open' && (
                        <Button id={`survey-${survey.id}-close`} variant="ghost" size="sm" onClick={async () => { const next = await run<SurveyView[]>(`/api/surveys/${survey.id}`, 'PATCH', { status: 'closed' }, 'Survey closed'); if (next) setSurveys(next); }}>
                          <Lock /> Close
                        </Button>
                      )}
                    </>
                  )}
                  {survey.status === 'open' &&
                    (survey.answered ? (
                      <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> You answered</span>
                    ) : (
                      <Button id={`survey-${survey.id}-take`} size="sm" onClick={() => setTaking(survey)}>Answer</Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <TakeSurveyDialog
        survey={taking}
        onOpenChange={(open) => !open && setTaking(null)}
        onSubmit={async (answers) => {
          const ok = await run(`/api/surveys/${taking!.id}/respond`, 'POST', { answers }, 'Thanks — your answers were recorded anonymously');
          if (ok) await load();
          return !!ok;
        }}
      />
      <CreateSurveyDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={async (input: CreateSurveyInput) => {
          const next = await run<SurveyView[]>('/api/surveys', 'POST', input, 'Survey opened');
          if (next) setSurveys(next);
          return !!next;
        }}
      />
    </>
  );
}
