'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ASSET_CATEGORIES } from '@/lib/assets';

function AddForm({ onSubmit, onCancel }: { onSubmit: (input: Record<string, string>) => Promise<boolean>; onCancel: () => void }) {
  const [form, setForm] = useState({ tag: '', name: '', category: 'Laptop', serial: '', purchasedOn: '' });
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!form.tag.trim() || !form.name.trim()) return;
        setBusy(true);
        await onSubmit(form);
        setBusy(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="asset-tag">Asset tag</Label><Input id="asset-tag" value={form.tag} maxLength={40} onChange={(e) => set('tag', e.target.value)} placeholder="LAP-0042" /></div>
        <div className="space-y-1.5">
          <Label htmlFor="asset-category">Category</Label>
          <Select value={form.category} onValueChange={(value) => set('category', value)}>
            <SelectTrigger id="asset-category"><SelectValue /></SelectTrigger>
            <SelectContent>{ASSET_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="asset-name">Name</Label><Input id="asset-name" value={form.name} maxLength={80} onChange={(e) => set('name', e.target.value)} placeholder='MacBook Pro 14" M4' /></div>
        <div className="space-y-1.5"><Label htmlFor="asset-serial">Serial number</Label><Input id="asset-serial" value={form.serial} maxLength={80} onChange={(e) => set('serial', e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="asset-purchased">Purchased</Label><Input id="asset-purchased" type="date" value={form.purchasedOn} onChange={(e) => set('purchasedOn', e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button id="asset-add-submit" type="submit" disabled={busy || !form.tag.trim() || !form.name.trim()}>{busy && <Loader2 className="animate-spin" />} Add to register</Button>
      </DialogFooter>
    </form>
  );
}

/** Adds equipment to the register. */
export default function AddAssetDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (input: Record<string, string>) => Promise<boolean> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Add equipment</DialogTitle></DialogHeader>
        {open && <AddForm onCancel={() => onOpenChange(false)} onSubmit={async (input) => { const ok = await onSubmit(input); if (ok) onOpenChange(false); return ok; }} />}
      </DialogContent>
    </Dialog>
  );
}
