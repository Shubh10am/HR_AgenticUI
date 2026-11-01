'use client';

import { useRef, useState } from 'react';
import { BarChart, CheckSquare, FileUp, Lightbulb, Loader2, SearchCheck, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { withAiRetry } from '../ai-retry';
import { analyzeResume, type AnalyzeResumeOutput } from '@/ai/flows/analyze-resume-flow';
import { extractResumeText } from '../resume-text';

/** General resume quality and ATS-readiness, not tied to a role. Useful for career coaching and internal moves. */
export default function ResumeCheckTab({ token }: { token: string | null }) {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResumeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async (file?: File) => {
    if (!file) return;
    try {
      setText(await extractResumeText(file));
      setFileName(file.name);
    } catch (error) {
      toast({ title: 'Could not read file', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const analyze = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      setResult(await withAiRetry(() => analyzeResume({ resumeText: text, authToken: token })));
    } catch (error) {
      toast({ title: 'Analysis failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="h-fit xl:col-span-2">
        <CardHeader>
          <CardTitle>Resume check</CardTitle>
          <CardDescription>A general quality and ATS-readability review, not tied to a role. Handy for internal moves and career coaching.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button id="resume-check-upload" variant="outline" className="w-full" onClick={() => fileInput.current?.click()}><FileUp className="mr-2 h-4 w-4" />{fileName ?? 'Upload PDF or TXT'}</Button>
          <input ref={fileInput} type="file" accept=".pdf,.txt" hidden onChange={(e) => load(e.target.files?.[0])} />
          <div className="grid gap-1.5">
            <Label htmlFor="resume-check-text">Resume text</Label>
            <Textarea id="resume-check-text" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[220px]" placeholder="Upload a file or paste the resume…" />
          </div>
          <Button id="resume-check-analyze" className="w-full" onClick={analyze} disabled={isLoading || text.trim().length < 50}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCheck className="mr-2 h-4 w-4" />}Analyze resume
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6 xl:col-span-3">
        {!result ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">{isLoading ? 'Analyzing…' : 'Results appear here.'}</Card>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle className="flex items-center text-lg"><BarChart className="mr-2 h-5 w-5 text-primary" />ATS readability</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-bold text-primary">{result.atsScore}<span className="text-xl text-muted-foreground"> / 100</span></p>
                <Progress value={result.atsScore} className="h-3" />
                <p className="text-sm">{result.overview}</p>
              </CardContent>
            </Card>
            {result.keywords?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center text-lg"><CheckSquare className="mr-2 h-5 w-5 text-primary" />Keywords found</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">{result.keywords.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}</CardContent>
              </Card>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="flex items-center text-lg"><ThumbsUp className="mr-2 h-5 w-5 text-green-500" />Strengths</CardTitle></CardHeader>
                <CardContent><ul className="list-disc space-y-1 pl-5 text-sm">{result.strengths.map((s) => <li key={s}>{s}</li>)}</ul></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Improve</CardTitle></CardHeader>
                <CardContent><ul className="list-disc space-y-1 pl-5 text-sm">{result.areasForImprovement.map((s) => <li key={s}>{s}</li>)}</ul></CardContent></Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
