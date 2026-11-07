'use client';

import { useState } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES, EXPENSE_CATEGORIES, RECEIPT_MAX_BYTES, RECEIPT_TYPES, type NewExpenseInput } from '@/lib/expenses';

const today = () => new Date().toISOString().slice(0, 10);

function ClaimForm({ onSubmit, onCancel }: { onSubmit: (input: NewExpenseInput) => Promise<boolean>; onCancel: () => void }) {
  const [category, setCategory] = useState<string>('Travel');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>('INR');
  const [spentOn, setSpentOn] = useState(today());
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<NewExpenseInput['receipt']>(null);
  const [fileError, setFileError] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = (file: File | undefined) => {
    setFileError('');
    if (!file) return;
    if (!RECEIPT_TYPES.includes(file.type)) return setFileError('Use a PNG, JPEG, WebP or PDF file.');
    if (file.size > RECEIPT_MAX_BYTES) return setFileError('Receipts can be up to 1.5 MB.');
    const reader = new FileReader();
    reader.onload = () => setReceipt({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const ready = merchant.trim() && Number(amount) > 0 && spentOn;

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!ready || busy) return;
        setBusy(true);
        await onSubmit({ category: category as NewExpenseInput['category'], merchant, amount: Number(amount), currency, spentOn, description, receipt });
        setBusy(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="expense-category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="expense-category"><SelectValue /></SelectTrigger>
            <SelectContent>{EXPENSE_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expense-date">Date</Label>
          <Input id="expense-date" type="date" max={today()} value={spentOn} onChange={(event) => setSpentOn(event.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="expense-merchant">Where</Label>
          <Input id="expense-merchant" maxLength={80} value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="e.g. airline, hotel, software vendor" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expense-amount">Amount</Label>
          <Input id="expense-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expense-currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="expense-currency"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="expense-description">Purpose (optional)</Label>
          <Textarea id="expense-description" rows={2} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Client visit, team offsite…" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="expense-receipt">Receipt</Label>
          {receipt ? (
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <Paperclip className="h-4 w-4" /> <span className="min-w-0 flex-1 truncate">{receipt.name}</span>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove receipt" onClick={() => setReceipt(null)}><X /></Button>
            </div>
          ) : (
            <Input id="expense-receipt" type="file" accept={RECEIPT_TYPES.join(',')} onChange={(event) => pick(event.target.files?.[0])} />
          )}
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button id="expense-submit" type="submit" disabled={!ready || busy}>{busy && <Loader2 className="animate-spin" />} Submit for approval</Button>
      </DialogFooter>
    </form>
  );
}

/** "New claim" dialog. The form lives inside the dialog so it resets each time it opens. */
export default function NewClaimDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (input: NewExpenseInput) => Promise<boolean> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New expense claim</DialogTitle>
          <DialogDescription>It goes to the approvers your organisation has set up, then HR marks it paid.</DialogDescription>
        </DialogHeader>
        {open && <ClaimForm onCancel={() => onOpenChange(false)} onSubmit={async (input) => { const ok = await onSubmit(input); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}
