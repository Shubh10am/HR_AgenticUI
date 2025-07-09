'use client';

import { useEffect } from 'react'
import { useState, type FormEvent, ChangeEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, UserCheck, FileText, PlayCircle, Briefcase, UploadCloud, BarChart, Lightbulb, CheckSquare, ThumbsUp, SearchCheck, Copy, Link as LinkIcon } from 'lucide-react';
import { generateJobDescription, type GenerateJobDescriptionInput, type GenerateJobDescriptionOutput } from '@/ai/flows/generate-job-description';
import { aiInterviewer, type AiInterviewerInput, type AiInterviewerOutput } from '@/ai/flows/ai-interviewer';
import { analyzeResume, type AnalyzeResumeInput, type AnalyzeResumeOutput } from '@/ai/flows/analyze-resume-flow';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuth } from '@/contexts/auth-context';


export default function RecruitmentPage() {
  const [jdPrompt, setJdPrompt] = useState('');
  const [generatedJd, setGeneratedJd] = useState('');
  const [isJdLoading, setIsJdLoading] = useState(false);

  const [interviewerJobDesc, setInterviewerJobDesc] = useState('');
  const [candidateResumeTextForInterview, setCandidateResumeTextForInterview] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [interviewRounds, setInterviewRounds] = useState('3');
  const [interviewResult, setInterviewResult] = useState<AiInterviewerOutput | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  
  const [resumeForAnalysis, setResumeForAnalysis] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResumeOutput | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  async function handleGenerateJd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
     if (!jdPrompt.trim()) {
      toast({ title: "Input Required", description: "Please enter job requirements prompt.", variant: "destructive" });
      return;
    }
    setIsJdLoading(true);
    setGeneratedJd('');
    try {
      const userApiKey = localStorage.getItem('userApiKey');
      const input: GenerateJobDescriptionInput = { 
        prompt: jdPrompt, 
        apiKey: userApiKey,
        userId: user?.id,
        organizationId: user?.organizationId,
      };
      const result: GenerateJobDescriptionOutput = await generateJobDescription(input);
      setGeneratedJd(result.jobDescription);
    } catch (error) {
      console.error('Error generating job description:', error);
      toast({ title: "Error", description: "Failed to generate job description.", variant: "destructive" });
    } finally {
      setIsJdLoading(false);
    }
  }

  const handleCopyJd = () => {
    if (!generatedJd) return;
    navigator.clipboard.writeText(generatedJd);
    toast({
      title: "Copied to Clipboard",
      description: "The job description has been copied.",
    });
  };

  async function handleAiInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!interviewerJobDesc.trim() || !candidateResumeTextForInterview.trim() || !candidateName.trim()) {
      toast({ title: "Input Required", description: "Please fill all fields for AI Interviewer.", variant: "destructive" });
      return;
    }

    const numInterviewRounds = parseInt(interviewRounds, 10);
    if (isNaN(numInterviewRounds) || numInterviewRounds < 1 || numInterviewRounds > 10) {
      toast({
        title: "Invalid Input",
        description: "Number of interview rounds must be an integer between 1 and 10.",
        variant: "destructive",
      });
      return;
    }

    setIsInterviewLoading(true);
    setInterviewResult(null);
    try {
      const userApiKey = localStorage.getItem('userApiKey');
      const input: AiInterviewerInput = {
        jobDescription: interviewerJobDesc,
        candidateResume: candidateResumeTextForInterview,
        candidateName,
        interviewRounds: numInterviewRounds,
        apiKey: userApiKey,
        userId: user?.id,
        organizationId: user?.organizationId,
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumeForAnalysis(text);
          toast({
            title: "Text File Loaded",
            description: `${file.name} content has been loaded into the text area.`,
          });
        };
        reader.onerror = () => {
          toast({
            title: "File Read Error",
            description: `Could not read the content of ${file.name}.`,
            variant: "destructive",
          });
        };
        reader.readAsText(file);
      } 
      // Handle PDF files
      else if (file.type === 'application/pdf') {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.mjs';
          const reader = new FileReader();
          reader.onload = async (e) => {
            const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
            console.log('PDF file loaded, extracting text...', typedArray.length, 'bytes');
            const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
            let fullText = '';

            for (let i = 0; i < pdf.numPages; i++) {
              const page = await pdf.getPage(i + 1);
              const content = await page.getTextContent();
              const pageText = content.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n';
            }

            setResumeForAnalysis(fullText.trim());
            toast({
              title: 'PDF Loaded',
              description: `${file.name} has been converted to text and loaded.`,
            });
          };
          reader.readAsArrayBuffer(file);
        } catch (err) {
          toast({
            title: 'PDF Parsing Error',
            description: `Failed to extract text from ${file.name}.`,
            variant: 'destructive',
          });
        }
      }
      else {
        toast({
          title: "Unsupported File Type",
          description: `Selected file ${file.name} is not a supported file type. Please select a .txt or .pdf file, or paste text.`,
          variant: "destructive",
        });
        setResumeForAnalysis('');
        setSelectedFileName(null);
         if (event.target) event.target.value = ''; // Reset file input
      }
    } else {
      setSelectedFileName(null);
      setResumeForAnalysis('');
    }
  };

  // Use useEffect to trigger analysis when resumeForAnalysis updates
  useEffect(() => {
    if (resumeForAnalysis.trim()) {
      const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
      handleAnalyzeResumeForATS(fakeEvent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeForAnalysis]);

  async function handleAnalyzeResumeForATS(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeForAnalysis.trim()) {
      toast({ title: "Input Required", description: "Please paste or load the resume text for analysis.", variant: "destructive" });
      return;
    }
    setIsAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const userApiKey = localStorage.getItem('userApiKey');
      const input: AnalyzeResumeInput = { 
        resumeText: resumeForAnalysis, 
        apiKey: userApiKey,
        userId: user?.id,
        organizationId: user?.organizationId,
      };
      const result: AnalyzeResumeOutput = await analyzeResume(input);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({ title: "Error", description: "Failed to analyze resume.", variant: "destructive" });
    } finally {
      setIsAnalysisLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI Recruitment System"
        description="Manage your entire recruitment lifecycle with AI-powered tools."
      />
      <Tabs defaultValue="job-creation" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="job-creation"><FileText className="mr-2 h-4 w-4" />Job Creation</TabsTrigger>
          <TabsTrigger value="resume-filtering"><UserCheck className="mr-2 h-4 w-4" />Resume Filtering</TabsTrigger>
          <TabsTrigger value="ats-score-check"><SearchCheck className="mr-2 h-4 w-4" />ATS Score Check</TabsTrigger>
          <TabsTrigger value="application-management"><Briefcase className="mr-2 h-4 w-4" />Applications</TabsTrigger>
          <TabsTrigger value="ai-interviewer"><PlayCircle className="mr-2 h-4 w-4" />AI Interviewer</TabsTrigger>
        </TabsList>

        <TabsContent value="job-creation">
          <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
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
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Generated Job Description:</h4>
                    <Button variant="ghost" size="sm" onClick={handleCopyJd}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap">{generatedJd}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume-filtering">
          <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle>Resume Filtering & Screening</CardTitle>
              <CardDescription>Define screening criteria and manage candidate pools. For detailed AI analysis, use "ATS Score Check".</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This section can be expanded with features like keyword-based filters, experience level requirements, and batch processing against basic criteria.
              </p>
              <div className="mt-4 p-4 border rounded-md bg-secondary/30">
                <h4 className="font-semibold mb-2">Future Features (Mock):</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Define keyword-based filters</li>
                  <li>Set experience level requirements</li>
                  <li>Integrate with job board applications</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ats-score-check">
          <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle>ATS Score Check & AI Resume Analysis</CardTitle>
              <CardDescription>Upload or paste resume text for an AI-powered analysis, ATS score, overview, keywords, and improvement suggestions.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyzeResumeForATS} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resumeFile">Upload Resume (.txt, .pdf)</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                    <Input
                      id="resumeFile"
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 sm:flex-grow"
                    />
                    {selectedFileName && (
                      <Badge variant="secondary" className="truncate max-w-xs sm:max-w-sm flex-shrink-0 py-1.5 px-3">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {selectedFileName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Content from uploaded files will be automatically loaded into the textarea below for analysis. You can also paste text directly.
                  </p>
                </div>
                <div>
                  <Label htmlFor="resumeForAtsAnalysisText">Resume Text for Analysis</Label>
                  <Textarea
                    id="resumeForAtsAnalysisText"
                    value={resumeForAnalysis}
                    onChange={(e) => setResumeForAnalysis(e.target.value)}
                    placeholder="Paste the full text of the resume here, or it will be auto-filled for uploads..."
                    className="mt-1 min-h-[200px]"
                    required
                  />
                </div>
                <Button type="submit" disabled={isAnalysisLoading}>
                  {isAnalysisLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCheck className="mr-2 h-4 w-4" />}
                  Analyze Resume & Get ATS Score
                </Button>
              </form>

              {isAnalysisLoading && (
                <div className="flex items-center justify-center py-8 mt-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Analyzing resume...</p>
                </div>
              )}

              {analysisResult && !isAnalysisLoading && (
                <div className="mt-6 space-y-6">
                  <Card className="bg-secondary/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center"><BarChart className="mr-2 h-5 w-5 text-primary"/>ATS Compatibility Score</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-4xl font-bold text-primary">{analysisResult.atsScore} <span className="text-xl text-muted-foreground">/ 100</span></p>
                      <Progress value={analysisResult.atsScore} className="h-3" />
                      <p className="text-xs text-muted-foreground">This score estimates compatibility with Applicant Tracking Systems based on common criteria.</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Resume Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{analysisResult.overview}</p>
                    </CardContent>
                  </Card>
                  
                  {analysisResult.keywords && analysisResult.keywords.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center"><CheckSquare className="mr-2 h-5 w-5 text-primary"/>Keywords Identified</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center"><ThumbsUp className="mr-2 h-5 w-5 text-green-500"/>Key Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {analysisResult.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/>Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {analysisResult.areasForImprovement.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="application-management">
          <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
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
          <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
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
                  <Label htmlFor="candidateResumeTextForInterview">Candidate Resume (Text)</Label>
                  <Textarea id="candidateResumeTextForInterview" value={candidateResumeTextForInterview} onChange={(e) => setCandidateResumeTextForInterview(e.target.value)} placeholder="Paste the candidate's resume text here..." className="mt-1 min-h-[100px]" />
                </div>
                <div>
                  <Label htmlFor="candidateName">Candidate Name</Label>
                  <Input id="candidateName" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="e.g., Jane Doe" className="mt-1" />
                </div>
                 <div>
                  <Label htmlFor="interviewRounds">Number of Interview Rounds</Label>
                  <Input 
                    id="interviewRounds" 
                    type="number" 
                    value={interviewRounds} 
                    onChange={(e) => setInterviewRounds(e.target.value)}
                    className="mt-1" 
                    min="1" 
                    max="10" 
                  />
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
                      <p><strong>Candidate Fit Score:</strong> <Badge variant={interviewResult.candidateFitScore > 70 ? "default" : "secondary"} className={interviewResult.candidateFitScore > 70 ? "bg-green-500 text-white" : interviewResult.candidateFitScore > 50 ? "bg-yellow-500 text-black" : "bg-red-500 text-white" }>{interviewResult.candidateFitScore}/100</Badge></p>
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
