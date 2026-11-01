'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  /** Pre-filled tool name; empty for a tool that isn't in the list. */
  integrationName: string;
  token: string;
  onClose: () => void;
  onRequested: (name: string) => void;
}

/** Files a support ticket asking for an integration, so the request reaches the platform team. */
export default function RequestDialog({ open, integrationName, token, onClose, onRequested }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [useCase, setUseCase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setName(integrationName); setUseCase(''); }
  }, [open, integrationName]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !useCase.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: `Integration request: ${name.trim()}`.slice(0, 150), description: useCase.trim(), priority: 'Low' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the request.');
      toast({ title: 'Request sent', description: `We've logged your request for ${name.trim()}. Track it under Get Support.` });
      onRequested(name.trim());
      onClose();
    } catch (error) {
      toast({ title: 'Could not send request', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Request an integration</DialogTitle>
          <DialogDescription>Tell us how you'd use it. Your request is filed as a support ticket you can follow under Get Support.</DialogDescription>
        </DialogHeader>
        <form id="integration-request-form" onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="integration-request-name">Tool</Label>
            <Input id="integration-request-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Personio" maxLength={80} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="integration-request-use-case">How would you use it?</Label>
            <Textarea id="integration-request-use-case" value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="e.g. Sync new hires from our ATS so onboarding starts automatically." className="min-h-[100px]" maxLength={2000} required />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button id="integration-request-submit" type="submit" form="integration-request-form" disabled={isSubmitting || !name.trim() || !useCase.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
