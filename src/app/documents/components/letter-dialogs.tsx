'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LETTER_TEMPLATES } from '@/lib/documents';

function RequestForm({ people, onSubmit, onCancel }: { people: { id: string; name: string }[] | null; onSubmit: (input: Record<string, string>) => Promise<boolean>; onCancel: () => void }) {
  const [template, setTemplate] = useState<string>('employment');
  const [purpose, setPurpose] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      {people && (
        <div className="space-y-1.5">
          <Label htmlFor="letter-person">For</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger id="letter-person"><SelectValue placeholder="Choose a person" /></SelectTrigger>
            <SelectContent>{people.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="letter-template">Letter</Label>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger id="letter-template"><SelectValue /></SelectTrigger>
          <SelectContent>{LETTER_TEMPLATES.map((item) => <SelectItem key={item.key} value={item.key}>{item.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="letter-purpose">Purpose (optional)</Label>
        <Input id="letter-purpose" value={purpose} maxLength={200} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. a visa application, a rental agreement" />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button id="letter-submit" disabled={busy || (!!people && !employeeId)} onClick={async () => { setBusy(true); await onSubmit({ template, purpose, ...(people ? { employeeId } : {}) }); setBusy(false); }}>
          {busy && <Loader2 className="animate-spin" />} {people ? 'Issue letter' : 'Request letter'}
        </Button>
      </DialogFooter>
    </div>
  );
}

/** Request a letter (employees) or issue one directly (HR and admins). */
export function RequestLetterDialog({ open, onOpenChange, people, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; people: { id: string; name: string }[] | null; onSubmit: (input: Record<string, string>) => Promise<boolean> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{people ? 'Issue a letter' : 'Request a letter'}</DialogTitle>
          <DialogDescription>Letters are filled from work records only — job title, team and dates.</DialogDescription>
        </DialogHeader>
        {open && <RequestForm people={people} onCancel={() => onOpenChange(false)} onSubmit={async (input) => { const ok = await onSubmit(input); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}

/** Shows an issued letter, ready to print or save as PDF. */
export function LetterPreview({ letter, onOpenChange }: { letter: { title: string; body: string } | null; onOpenChange: (open: boolean) => void }) {
  const print = () => {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win || !letter) return;
    const doc = win.document;
    doc.title = letter.title;
    const pre = doc.createElement('pre');
    pre.textContent = letter.body;
    pre.setAttribute('style', 'font: 15px/1.7 Georgia, serif; white-space: pre-wrap; max-width: 640px; margin: 64px auto;');
    doc.body.appendChild(pre);
    win.print();
  };
  return (
    <Dialog open={!!letter} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{letter?.title}</DialogTitle></DialogHeader>
        <Textarea readOnly value={letter?.body ?? ''} rows={16} className="font-serif text-sm leading-relaxed" />
        <DialogFooter><Button id="letter-print" onClick={print}>Print or save as PDF</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
