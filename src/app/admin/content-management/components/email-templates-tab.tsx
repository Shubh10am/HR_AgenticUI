'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useAdminData } from '../../components/use-admin-data';
import type { EmailTemplateItem } from '../types';

/** Example values for the preview only. */
const SAMPLE_VALUES: Record<string, string> = {
  name: 'Alex Morgan',
  organizationName: 'Acme Corp',
  organizationId: '64f0c2a1b2c3d4e5f6a7b8c9',
  email: 'alex@acme.example',
  password: '••••••••',
  subject: 'Pricing question',
  companyName: 'Acme Corp',
};

const fillSample = (text: string) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => SAMPLE_VALUES[name] ?? `{{${name}}}`);

export default function EmailTemplatesTab() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { data, error, reload } = useAdminData<{ templates: EmailTemplateItem[] }>('/api/admin/email-templates');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const selected = data?.templates.find((template) => template.key === selectedKey) ?? data?.templates[0];
  const isDirty = Boolean(selected && (subject !== selected.subject || body !== selected.body));

  useEffect(() => {
    if (selected) { setSubject(selected.subject); setBody(selected.body); }
  }, [selected]);

  const insertVariable = (variable: string) => {
    const textarea = bodyRef.current;
    const token = `{{${variable}}}`;
    if (!textarea) { setBody((current) => current + token); return; }
    const { selectionStart, selectionEnd } = textarea;
    setBody((current) => current.slice(0, selectionStart) + token + current.slice(selectionEnd));
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(selectionStart + token.length, selectionStart + token.length); });
  };

  const submit = async (payload: Record<string, unknown>, successTitle: string) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: selected.key, ...payload }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { toast({ title: 'Template not saved', description: result.error, variant: 'destructive' }); return; }
      toast({ title: successTitle, description: selected.name });
      await reload();
    } finally {
      setIsSaving(false);
    }
  };

  if (error) return <Card className="p-4 text-sm text-destructive">{error}</Card>;
  if (!data || !selected) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit p-2">
        <ul className="space-y-0.5">
          {data.templates.map((template) => (
            <li key={template.key}>
              <button
                type="button"
                id={`admin-template-${template.key}`}
                onClick={() => {
                  if (isDirty && !window.confirm('Discard your unsaved changes to this template?')) return;
                  setSelectedKey(template.key);
                }}
                className={cn('w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted', template.key === selected.key && 'bg-primary/10 text-primary')}
              >
                <span className="flex items-center justify-between gap-2 font-medium">{template.name}{template.isCustomized && <Badge variant="secondary" className="text-[10px]">Edited</Badge>}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selected.name}</CardTitle>
            <CardDescription>{selected.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-template-subject">Subject</Label>
              <Input id="admin-template-subject" value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-template-body">Message</Label>
              <Textarea id="admin-template-body" ref={bodyRef} value={body} maxLength={5000} onChange={(event) => setBody(event.target.value)} className="min-h-[260px] font-mono text-xs leading-relaxed" />
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                Insert:
                {selected.variables.map((variable) => (
                  <button key={variable} type="button" id={`admin-template-insert-${variable}`} onClick={() => insertVariable(variable)} className="rounded border bg-muted px-1.5 py-0.5 font-mono hover:border-primary hover:text-primary">{`{{${variable}}}`}</button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Plain text. Line breaks are kept; the greeting, sign-off and any button are added automatically.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <p className="text-xs text-muted-foreground">{selected.isCustomized && selected.updatedAt ? `Edited ${format(new Date(selected.updatedAt), 'd MMM yyyy, HH:mm')}` : 'Using the default wording'}</p>
              <div className="flex gap-2">
                {selected.isCustomized && (
                  <Button id="admin-template-reset" variant="ghost" size="sm" disabled={isSaving} onClick={() => window.confirm('Restore the default wording for this email?') && submit({ reset: true }, 'Default restored')}>
                    <RotateCcw className="mr-2 h-4 w-4" />Restore default
                  </Button>
                )}
                <Button id="admin-template-save" size="sm" disabled={!isDirty || isSaving || !subject.trim() || !body.trim()} onClick={() => submit({ subject, body }, 'Template saved')}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>With example values.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <div className="border-b bg-muted/50 px-4 py-2 text-sm"><span className="text-muted-foreground">Subject: </span><span className="font-medium">{fillSample(subject)}</span></div>
              <div className="space-y-3 p-4 text-sm leading-relaxed">
                <p className="font-semibold">Hi {selected.variables.includes('name') ? SAMPLE_VALUES.name : 'New Admin'},</p>
                <p className="whitespace-pre-line text-foreground/80">{fillSample(body)}</p>
                {selected.key === 'password-reset' && <span className="inline-block rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Reset Your Password</span>}
                <p className="text-foreground/80">Best regards,<br />The team</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
