'use client';

import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, UserCheck, FileText, PlayCircle, Briefcase } from 'lucide-react';
import { generateJobDescription, type GenerateJobDescriptionInput, type GenerateJobDescriptionOutput } from '@/ai/flows/generate-job-description';
import { aiInterviewer, type AiInterviewerInput, type AiInterviewerOutput } from '@/ai/flows/ai-interviewer';
import { useToast } from "@/hooks/use-toast";

export default function RecruitmentPage() {
  const [jdPrompt, setJdPrompt] = useState('');
  const [generatedJd, setGeneratedJd] = useState('');
  const [isJdLoading, setIsJdLoading] = useState(false);

  const [interviewerJobDesc, setInterviewerJobDesc] = useState('');
  const [candidateResume, setCandidateResume] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [interviewRounds, setInterviewRounds] = useState(3);
  const [interviewResult, setInterviewResult] = useState<AiInterviewerOutput | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const { toast } = useToast();

  async function handleGenerateJd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
     if (!jdPrompt.trim()) {
      toast({ title: "Input Required", description: "Please enter job requirements prompt.", variant: "destructive" });
      return;
    }
    setIsJdLoading(true);
    setGeneratedJd('');
    try {
      const input: GenerateJobDescriptionInput = { prompt: jdPrompt };
      const result: GenerateJobDescriptionOutput = await generateJobDescription(input);
      setGeneratedJd(result.jobDescription);
    } catch (error) {
      console.error('Error generating job description:', error);
      toast({ title: "Error", description: "Failed to generate job description.", variant: "destructive" });
    } finally {
      setIsJdLoading(false);
    }
  }

  async function handleAiInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!interviewerJobDesc.trim() || !candidateResume.trim() || !candidateName.trim()) {
      toast({ title: "Input Required", description: "Please fill all fields for AI Interviewer.", variant: "destructive" });
      return;
    }
    setIsInterviewLoading(true);
    setInterviewResult(null);
    try {
      const input: AiInterviewerInput = {
        jobDescription: interviewerJobDesc,
        candidateResume,
        candidateName,
        interviewRounds
      };
      const result: AiInterviewerOutput = await aiInterviewer(input);
      setInterviewResult(result);
    } catch (error) {
      console.error('Error conducting AI interview:', error);
      toast({ title: "Error", description: "Failed to conduct AI interview.", variant: "destructive" });
    } finally {
      setIsInterviewLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI Recruitment System"
        description="Manage your entire recruitment lifecycle with AI-powered tools."
      />
      <Tabs defaultValue="job-creation" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="job-creation"><FileText className="mr-2 h-4 w-4" />Job Creation</TabsTrigger>
          <TabsTrigger value="resume-filtering"><UserCheck className="mr-2 h-4 w-4" />Resume Filtering</TabsTrigger>
          <TabsTrigger value="application-management"><Briefcase className="mr-2 h-4 w-4" />Applications</TabsTrigger>
          <TabsTrigger value="ai-interviewer"><PlayCircle className="mr-2 h-4 w-4" />AI Interviewer</TabsTrigger>
        </TabsList>

        <TabsContent value="job-creation">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI Job Description Generator</CardTitle>
              <CardDescription>Create detailed, skill-based job descriptions using AI prompts.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateJd} className="space-y-4">
                <div>
                  <Label htmlFor="jdPrompt">Job Requirements Prompt</Label>
                  <Textarea
                    id="jdPrompt"
                    value={jdPrompt}
                    onChange={(e) => setJdPrompt(e.target.value)}
                    placeholder="e.g., 'Senior Frontend Developer with React, TypeScript, and 5+ years experience...'"
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <Button type="submit" disabled={isJdLoading}>
                  {isJdLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate Job Description
                </Button>
              </form>
              {generatedJd && (
                <div className="mt-6 p-4 border rounded-md bg-secondary/30">
                  <h4 className="font-semibold mb-2">Generated Job Description:</h4>
                  <pre className="text-sm whitespace-pre-wrap">{generatedJd}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume-filtering">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI Resume Filtering (ATS)</CardTitle>
              <CardDescription>Screen and shortlist candidates based on relevance and experience. (Mock)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This section will feature AI-powered resume screening. Upload resumes or connect your applicant pool, and the AI will analyze and rank candidates based on job requirements.
              </p>
              <div className="mt-4 p-4 border rounded-md bg-secondary/30">
                <h4 className="font-semibold mb-2">Mock Candidate List:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Jane Doe - Software Engineer - Score: 92% - Status: Shortlisted</li>
                  <li>John Smith - Product Manager - Score: 78% - Status: Reviewing</li>
                  <li>Alice Brown - UX Designer - Score: 85% - Status: Shortlisted</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="application-management">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Application Management</CardTitle>
              <CardDescription>Control job post duration and status. (Mock)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage your job postings, track applicant statuses, and send automated tasks or tests to shortlisted candidates from this interface.
              </p>
               <div className="mt-4 p-4 border rounded-md bg-secondary/30">
                <h4 className="font-semibold mb-2">Mock Job Postings:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Senior Backend Engineer - Active (32 applicants) - Ends in 15 days</li>
                  <li>Marketing Specialist - Active (12 applicants) - Ends in 7 days</li>
                  <li>Data Analyst - Closed (5 applicants shortlisted)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-interviewer">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI Interviewer</CardTitle>
              <CardDescription>Conduct initial technical and HR rounds via AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAiInterview} className="space-y-4">
                <div>
                  <Label htmlFor="interviewerJobDesc">Job Description</Label>
                  <Textarea id="interviewerJobDesc" value={interviewerJobDesc} onChange={(e) => setInterviewerJobDesc(e.target.value)} placeholder="Paste the full job description here..." className="mt-1 min-h-[100px]" />
                </div>
                <div>
                  <Label htmlFor="candidateResume">Candidate Resume (Text)</Label>
                  <Textarea id="candidateResume" value={candidateResume} onChange={(e) => setCandidateResume(e.target.value)} placeholder="Paste the candidate's resume text here..." className="mt-1 min-h-[100px]" />
                </div>
                <div>
                  <Label htmlFor="candidateName">Candidate Name</Label>
                  <Input id="candidateName" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="e.g., Jane Doe" className="mt-1" />
                </div>
                 <div>
                  <Label htmlFor="interviewRounds">Number of Interview Rounds</Label>
                  <Input id="interviewRounds" type="number" value={interviewRounds} onChange={(e) => setInterviewRounds(parseInt(e.target.value))} className="mt-1" min="1" max="10" />
                </div>
                <Button type="submit" disabled={isInterviewLoading}>
                  {isInterviewLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                  Start AI Interview
                </Button>
              </form>
              {interviewResult && (
                <div className="mt-6 space-y-4">
                  <Card className="bg-secondary/30">
                    <CardHeader><CardTitle className="text-lg">Interview Summary</CardTitle></CardHeader>
                    <CardContent>
                      <p><strong>Candidate Fit Score:</strong> <Badge variant={interviewResult.candidateFitScore > 70 ? "default" : "secondary"} className={interviewResult.candidateFitScore > 70 ? "bg-green-500" : "bg-yellow-500"}>{interviewResult.candidateFitScore}/100</Badge></p>
                      <h4 className="font-semibold mt-2 mb-1">Overall Feedback:</h4>
                      <p className="text-sm whitespace-pre-wrap">{interviewResult.overallFeedback}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-secondary/30">
                     <CardHeader><CardTitle className="text-lg">Interview Transcript</CardTitle></CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">{interviewResult.interviewTranscript}</pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
