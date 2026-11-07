'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SURVEY_TEMPLATES } from '@/lib/surveys';
import { cn } from '@/lib/utils';

export interface CreateSurveyInput {
  title: string;
  description: string;
  questions: (typeof SURVEY_TEMPLATES)[number]['questions'];
  closesInDays: number;
}

function CreateForm({ onSubmit, onCancel }: { onSubmit: (input: CreateSurveyInput) => Promise<boolean>; onCancel: () => void }) {
  const [templateId, setTemplateId] = useState(SURVEY_TEMPLATES[0].id);
  const template = SURVEY_TEMPLATES.find((item) => item.id === templateId)!;
  const [title, setTitle] = useState(template.title);
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {SURVEY_TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            id={`survey-template-${item.id}`}
            onClick={() => {
              setTemplateId(item.id);
              setTitle(item.title);
            }}
            className={cn('rounded-xl border p-3 text-left transition-colors', templateId === item.id ? 'border-primary bg-primary/5' : 'hover:border-primary/40')}
          >
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.questions.length} questions</p>
          </button>
        ))}
      </div>
      <ul className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
        {template.questions.map((question) => <li key={question.key}>• {question.text}</li>)}
      </ul>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div className="space-y-1.5">
          <Label htmlFor="survey-title">Title</Label>
          <Input id="survey-title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="survey-duration">Open for</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger id="survey-duration"><SelectValue /></SelectTrigger>
            <SelectContent>{['3', '7', '14', '30'].map((value) => <SelectItem key={value} value={value}>{value} days</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          id="survey-create"
          disabled={!title.trim() || busy}
          onClick={async () => {
            setBusy(true);
            await onSubmit({ title, description: template.description, questions: template.questions, closesInDays: Number(days) });
            setBusy(false);
          }}
        >
          {busy && <Loader2 className="animate-spin" />} Open survey
        </Button>
      </DialogFooter>
    </div>
  );
}

/** Start a survey from a template (HR and admins). */
export default function CreateSurveyDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (input: CreateSurveyInput) => Promise<boolean> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New pulse survey</DialogTitle>
          <DialogDescription>Everyone in the organisation can answer, anonymously.</DialogDescription>
        </DialogHeader>
        {open && <CreateForm onCancel={() => onOpenChange(false)} onSubmit={async (input) => { const ok = await onSubmit(input); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}
