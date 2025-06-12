
'use client';

import { useState, type FormEvent, ChangeEvent } from 'react'; // Added ChangeEvent
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, UserCheck, FileText, PlayCircle, Briefcase, UploadCloud, BarChart, Lightbulb, CheckSquare, ThumbsUp, SearchCheck } from 'lucide-react';
import { generateJobDescription, type GenerateJobDescriptionInput, type GenerateJobDescriptionOutput } from '@/ai/flows/generate-job-description';
import { aiInterviewer, type AiInterviewerInput, type AiInterviewerOutput } from '@/ai/flows/ai-interviewer';
import { analyzeResume, type AnalyzeResumeInput, type AnalyzeResumeOutput } from '@/ai/flows/analyze-resume-flow';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const defaultResumeText = `----

**Shubham Singh**  
DEVELOPER | COMPETITIVE CODER  
+91-6388842678 | shubham12342019@gmail.com  

**TECHNICAL SKILLS**  
- Data Structures and Algorithms  
- HTML, CSS, JavaScript, React JS, FlaskAPI, FastAPI, Django  
- Languages: C, C++, Python  
- Git and GitHub  
- OOPS, DBMS, SQL, Docker, AWS  
- Database: MySQL, MongoDB, Redis  

**EDUCATION**  
**Bachelor of Technology, Information Technology**  
ABES Engineering College | 2020–2024 | CGPA (1–8 Sem): 7.4  

**Class X & XII (ICSE & ISC)**  
St. Mary's School | 2018–2020 |  
Percentage: 85% (Class X) | 82% (Class XII)  

**LINKS**  
- LinkedIn: https://www.linkedin.com/in/shubhamsingh-192379201/  
- GitHub: https://github.com/shubh10am  
- CodeChef: https://www.codechef.com/users/shubham10  
- LeetCode: https://leetcode.com/_shubh_10/  

**CERTIFICATIONS AND ACHIEVEMENTS**  
- Certified in Python (Coursera and Cisco)  
- HackerRank: 5-star coder  
- CodeChef: 2-star coder with a rating of 1430+  
- LeetCode: 500+ questions solved  

**PROJECTS**  
- **Charity-Connect Website (Python, Flask Template)**  
  A charity website aimed at helping beggars through donations.  
- **Detecting Emotions Using Machine Learning**  
  Identifies 7 different emotions with an accuracy of 66%.  
- **Building a Blog App with MERN Stack**  
  Executes CRUD operations and persists data into a database.  
- **Creating a Resume Builder with MERN Stack**  
  Creates a resume and saves it to Firebase with authentication.  

**EXPERIENCE**  
**Surepass Technology (Backend Developer)**  
Full-Time Python Developer | 0–6 months  
- Worked on various live projects, fixed major bugs, and created APIs in Python backend.  
- Created and tested APIs, wrappers, and implemented internal API calling.  
- Involved in web scraping, worked with Redis, Docker, Mongo Engine, and pipelines.  
- Worked on FastAPI, Flask API, and Jinja Template.  
- Contributed to Gen AI projects.  

**MxAlgoTechnology (Software Engineer)**  
- Developed microservices-based backends using Azure DevOps, ADLS, and Blob Storage.  
- Implemented raw SQL queries in SQL Server and ORM in MongoDB for efficient data handling.  
- Created complete backend solutions from scratch for optimal performance and scalability.  

**Kloudfarm (Software Engineer) (Current)**  
- Developed backend microservices in FastAPI using MongoDB, PostgreSQL, Docker, and AWS for efficient processing.  
- Integrated AI agents with FastAPI to enhance functionality and user experience.  
- Optimized APIs with parallel processing and threading, improving response time for parallel tasks using asyncio.  

---`;

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
  
  const [resumeForAnalysis, setResumeForAnalysis] = useState(defaultResumeText); // Set default text
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResumeOutput | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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
      const input: AiInterviewerInput = {
        jobDescription: interviewerJobDesc,
        candidateResume: candidateResumeTextForInterview,
        candidateName,
        interviewRounds: numInterviewRounds
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
      toast({
        title: "File Selected",
        description: `${file.name}. Please copy its content into the text area below for analysis. Direct file processing is a future enhancement.`,
        duration: 7000,
      });
      // Future: Implement text extraction here and setResumeForAnalysis(extractedText)
    } else {
      setSelectedFileName(null);
    }
  };

  async function handleAnalyzeResumeForATS(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeForAnalysis.trim()) {
      toast({ title: "Input Required", description: "Please paste the resume text for analysis.", variant: "destructive" });
      return;
    }
    setIsAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const input: AnalyzeResumeInput = { resumeText: resumeForAnalysis };
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="job-creation"><FileText className="mr-2 h-4 w-4" />Job Creation</TabsTrigger>
          <TabsTrigger value="resume-filtering"><UserCheck className="mr-2 h-4 w-4" />Resume Filtering</TabsTrigger>
          <TabsTrigger value="ats-score-check"><SearchCheck className="mr-2 h-4 w-4" />ATS Score Check</TabsTrigger>
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
              <CardTitle>Resume Filtering & Screening</CardTitle>
              <CardDescription>Tools for defining screening criteria and managing candidate pools. For detailed AI analysis, use "ATS Score Check".</CardDescription>
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
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>ATS Score Check & AI Resume Analysis</CardTitle>
              <CardDescription>Upload or paste resume text for an AI-powered analysis, ATS score, overview, keywords, and improvement suggestions.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyzeResumeForATS} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resumeFile">Upload Resume (PDF, DOCX, TXT)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="resumeFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {selectedFileName && (
                      <Badge variant="secondary" className="truncate max-w-xs">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {selectedFileName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After selecting a file, please copy its text content into the textarea below for analysis. Direct file processing is a future enhancement.
                  </p>
                </div>
                <div>
                  <Label htmlFor="resumeForAtsAnalysisText">Or Paste Resume Text</Label>
                  <Textarea
                    id="resumeForAtsAnalysisText"
                    value={resumeForAnalysis}
                    onChange={(e) => setResumeForAnalysis(e.target.value)}
                    placeholder="Paste the full text of the resume here..."
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
