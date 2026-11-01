'use client';

import { useState } from 'react';
import { ClipboardList, FileSearch, FileText, KanbanSquare, Sparkles, UserCheck } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useRecruitmentStore } from './store';
import { SAMPLE_ROLE } from './sample-data';
import RoleBar from './components/role-bar';
import JobDescriptionTab from './components/job-description-tab';
import ScreeningTab from './components/screening-tab';
import PipelineTab from './components/pipeline-tab';
import InterviewKitTab from './components/interview-kit-tab';
import ResumeCheckTab from './components/resume-check-tab';

const TABS = [
  { id: 'job', label: 'Job description', icon: FileText },
  { id: 'screen', label: 'Screen candidates', icon: UserCheck },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { id: 'interview', label: 'Interview kit', icon: ClipboardList },
  { id: 'resume-check', label: 'Resume check', icon: FileSearch },
] as const;

export default function RecruitmentPage() {
  const { user, token } = useAuth();
  const store = useRecruitmentStore(user?.email ?? 'anonymous');
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('job');
  const [kitCandidateId, setKitCandidateId] = useState<string | null>(null);
  const role = store.activeRole;

  return (
    <>
      <PageHeader title="AI Recruitment" description="Write the job, screen resumes against it, move candidates through your pipeline and prepare fair, structured interviews." />
      <RoleBar store={store} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <div className="mb-6 overflow-x-auto">
          <TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-1 p-1 md:min-w-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const count = id === 'pipeline' ? role?.candidates.length : undefined;
              return (
                <TabsTrigger key={id} id={`recruitment-tab-${id}`} value={id} className="shrink-0 gap-2 px-3 py-2">
                  <Icon className="h-4 w-4" />{label}{count ? <span className="rounded-full bg-primary/15 px-1.5 text-xs text-primary">{count}</span> : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="resume-check"><ResumeCheckTab token={token} /></TabsContent>

        {tab !== 'resume-check' && !role ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <Sparkles className="h-8 w-8 text-primary" />
            <p className="font-semibold">Start with an open role</p>
            <p className="max-w-md text-sm text-muted-foreground">Everything here belongs to a role: its job description, screened candidates, pipeline and interview kit. Roles and candidates are saved in this browser.</p>
            <div className="flex gap-2">
              <Button id="recruitment-empty-new" variant="outline" onClick={() => store.createRole()}>New role</Button>
              <Button id="recruitment-empty-sample" onClick={() => store.createRole(SAMPLE_ROLE)}>Try a sample role</Button>
            </div>
          </Card>
        ) : role && (
          <>
            <TabsContent value="job"><JobDescriptionTab key={role.id} store={store} token={token} onNext={() => setTab('screen')} /></TabsContent>
            <TabsContent value="screen"><ScreeningTab key={role.id} store={store} token={token} onNext={() => setTab('pipeline')} /></TabsContent>
            <TabsContent value="pipeline"><PipelineTab store={store} onInterviewKit={(id) => { setKitCandidateId(id); setTab('interview'); }} /></TabsContent>
            <TabsContent value="interview"><InterviewKitTab key={role.id} store={store} token={token} candidateId={kitCandidateId} onCandidateChange={setKitCandidateId} /></TabsContent>
          </>
        )}
      </Tabs>
    </>
  );
}
