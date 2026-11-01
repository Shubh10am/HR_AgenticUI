'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { EMPTY_PLAN, type Plan, type PlanDraft } from '../types';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR'];

/** The form body; mounted fresh each time the dialog opens so drafts never leak between plans. */
function PlanForm({ plan, onSave, onCancel }: { plan: Plan | null; onSave: (draft: PlanDraft) => Promise<string | null>; onCancel: () => void }) {
  const [draft, setDraft] = useState<PlanDraft>(plan ? { ...plan } : EMPTY_PLAN);
  const [featuresText, setFeaturesText] = useState((plan?.features ?? []).join('\n'));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const set = <K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const message = await onSave({ ...draft, features: featuresText.split('\n').map((line) => line.trim()).filter(Boolean) });
    setIsSaving(false);
    setError(message);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="admin-plan-name">Name</Label>
          <Input id="admin-plan-name" value={draft.name} maxLength={60} onChange={(event) => set('name', event.target.value)} required autoFocus />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="admin-plan-description">Short description</Label>
          <Input id="admin-plan-description" value={draft.description} maxLength={300} onChange={(event) => set('description', event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-plan-interval">Billing</Label>
          <Select value={draft.interval} onValueChange={(value) => set('interval', value as PlanDraft['interval'])}>
            <SelectTrigger id="admin-plan-interval"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
              <SelectItem value="custom">Custom (contact sales)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {draft.interval !== 'custom' && (
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="admin-plan-price">Price</Label>
              <Input id="admin-plan-price" type="number" min={0} step="0.01" value={draft.price} onChange={(event) => set('price', Number(event.target.value))} />
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="admin-plan-currency">Currency</Label>
              <Select value={draft.currency} onValueChange={(value) => set('currency', value)}>
                <SelectTrigger id="admin-plan-currency"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="admin-plan-features">Features</Label>
          <Textarea id="admin-plan-features" value={featuresText} onChange={(event) => setFeaturesText(event.target.value)} rows={5} placeholder={'One feature per line\n50 AI interviews a month\nEmail support'} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-plan-order">Display order</Label>
          <Input id="admin-plan-order" type="number" value={draft.sortOrder} onChange={(event) => set('sortOrder', Number(event.target.value))} />
        </div>
        <div className="space-y-3 pt-6">
          <label className="flex items-center gap-2 text-sm"><Switch id="admin-plan-active" checked={draft.isActive} onCheckedChange={(checked) => set('isActive', checked)} />Available to customers</label>
          <label className="flex items-center gap-2 text-sm"><Switch id="admin-plan-highlighted" checked={draft.isHighlighted} onCheckedChange={(checked) => set('isHighlighted', checked)} />Mark as recommended</label>
        </div>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <DialogFooter>
        <Button id="admin-plan-cancel" type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button id="admin-plan-save" type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{plan ? 'Save plan' : 'Create plan'}</Button>
      </DialogFooter>
    </form>
  );
}

export default function PlanDialog({ open, plan, onClose, onSave }: {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
  /** Returns an error message, or null when saved. */
  onSave: (draft: PlanDraft) => Promise<string | null>;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{plan ? `Edit ${plan.name}` : 'New plan'}</DialogTitle>
          <DialogDescription>Plans are available from the public /api/plans endpoint for a pricing page.</DialogDescription>
        </DialogHeader>
        {open && <PlanForm key={plan?._id ?? 'new'} plan={plan} onSave={onSave} onCancel={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
