'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NameDialogProps {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  initialName?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}

/** Single-field dialog used for "New folder" and "Rename". */
export default function NameDialog({ open, title, description, submitLabel, initialName = '', onOpenChange, onSubmit }: NameDialogProps) {
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSubmit(name.trim());
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="kb-name-input" className="sr-only">Name</Label>
            <Input id="kb-name-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} autoFocus />
          </div>
          <DialogFooter>
            <Button id="kb-name-cancel" type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button id="kb-name-submit" type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="animate-spin" />}{submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
