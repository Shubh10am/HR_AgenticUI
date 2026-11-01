'use client';

import { useState } from 'react';
import { Copy, Download, Loader2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { withAiRetry } from '../ai-retry';
import { generateJobDescription } from '@/ai/flows/generate-job-description';
import { roleBrief, type RecruitmentStore, type RoleDetails } from '../store';

function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function JobDescriptionTab({ store, token, onNext }: { store: RecruitmentStore; token: string | null; onNext: () => void }) {
  const { toast } = useToast();
  const role = store.activeRole!;
  const d = role.details;
  const [isGenerating, setIsGenerating] = useState(false);
  const set = <K extends keyof RoleDetails>(key: K, value: RoleDetails[K]) => store.updateRole(role.id, (r) => ({ ...r, details: { ...r.details, [key]: value } }));

  const generate = async () => {
    if (!d.title.trim() || !d.mustHaves.trim()) {
      toast({ title: 'Add a title and must-haves', description: 'The AI writes from these.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const { jobDescription } = await withAiRetry(() => generateJobDescription({ prompt: roleBrief(d), authToken: token }));
      store.updateRole(role.id, (r) => ({ ...r, jobDescription }));
    } catch (error) {
      toast({ title: 'Could not generate', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([role.jobDescription], { type: 'text/markdown' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${(d.title || 'job-description').replace(/\W+/g, '-').toLowerCase()}.md` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Role details</CardTitle>
          <CardDescription>Fill in what you know. The AI turns it into an inclusive, structured job description.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field id="jd-title" label="Job title *"><Input id="jd-title" value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior Frontend Engineer" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="jd-department" label="Team"><Input id="jd-department" value={d.department} onChange={(e) => set('department', e.target.value)} placeholder="Engineering" /></Field>
            <Field id="jd-location" label="Location"><Input id="jd-location" value={d.location} onChange={(e) => set('location', e.target.value)} placeholder="Bengaluru" /></Field>
            <Field id="jd-level" label="Level">
              <Select value={d.level} onValueChange={(v) => set('level', v as RoleDetails['level'])}><SelectTrigger id="jd-level"><SelectValue /></SelectTrigger>
                <SelectContent>{['Entry', 'Mid', 'Senior', 'Lead', 'Manager'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            </Field>
            <Field id="jd-work-mode" label="Work mode">
              <Select value={d.workMode} onValueChange={(v) => set('workMode', v as RoleDetails['workMode'])}><SelectTrigger id="jd-work-mode"><SelectValue /></SelectTrigger>
                <SelectContent>{['On-site', 'Hybrid', 'Remote'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            </Field>
            <Field id="jd-employment" label="Employment type">
              <Select value={d.employmentType} onValueChange={(v) => set('employmentType', v as RoleDetails['employmentType'])}><SelectTrigger id="jd-employment"><SelectValue /></SelectTrigger>
                <SelectContent>{['Full-time', 'Part-time', 'Contract', 'Internship'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            </Field>
            <Field id="jd-salary" label="Salary range"><Input id="jd-salary" value={d.salaryRange} onChange={(e) => set('salaryRange', e.target.value)} placeholder="Optional" /></Field>
          </div>
          <Field id="jd-must" label="Must-haves *" hint="One per line. Screening scores mainly on these.">
            <Textarea id="jd-must" value={d.mustHaves} onChange={(e) => set('mustHaves', e.target.value)} className="min-h-[96px]" placeholder={'- 5+ years with React and TypeScript\n- Shipped features end to end'} />
          </Field>
          <Field id="jd-nice" label="Nice to have"><Textarea id="jd-nice" value={d.niceToHaves} onChange={(e) => set('niceToHaves', e.target.value)} className="min-h-[72px]" /></Field>
          <Field id="jd-notes" label="Anything else"><Input id="jd-notes" value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Team, product, benefits…" /></Field>
          <Button id="jd-generate" onClick={generate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {role.jobDescription ? 'Regenerate job description' : 'Generate job description'}
          </Button>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Job description</CardTitle>
            <CardDescription>Edit freely. Screening uses this exact text.</CardDescription>
          </div>
          {role.jobDescription && (
            <div className="flex gap-1">
              <Button id="jd-copy" variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(role.jobDescription); toast({ title: 'Copied' }); }}><Copy className="mr-1.5 h-4 w-4" />Copy</Button>
              <Button id="jd-download" variant="ghost" size="sm" onClick={download}><Download className="mr-1.5 h-4 w-4" />.md</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea id="jd-text" value={role.jobDescription} onChange={(e) => store.updateRole(role.id, (r) => ({ ...r, jobDescription: e.target.value }))}
            className="min-h-[460px] font-mono text-xs leading-relaxed"
            placeholder={isGenerating ? 'Writing…' : 'Generate from the role details, or paste an existing job description here.'} />
          <div className="flex justify-end">
            <Button id="jd-next" variant="secondary" disabled={role.jobDescription.trim().length < 50} onClick={onNext}>Next: screen candidates →</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
