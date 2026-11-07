'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APP_CATEGORIES, type AppView } from '@/lib/apps';

type Submit = (input: Record<string, unknown>) => Promise<boolean>;

function AppForm({ app, onSubmit, onDone }: { app: AppView | null; onSubmit: Submit; onDone: () => void }) {
  const [form, setForm] = useState({ name: app?.name ?? '', url: app?.url ?? '', category: app?.category ?? 'Productivity', description: app?.description ?? '', defaultFor: (app?.defaultFor ?? []).join(', '), requiresApproval: app?.requiresApproval ?? true, active: app?.active ?? true });
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await onSubmit({ id: app?.id, ...form, defaultFor: form.defaultFor.split(',').map((d) => d.trim()).filter(Boolean) });
        setBusy(false);
        if (ok) onDone();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="app-name">App</Label><Input id="app-name" value={form.name} maxLength={60} placeholder="e.g. Figma" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="app-category">Category</Label>
          <Select value={form.category} onValueChange={(category) => setForm({ ...form, category: category as AppView['category'] })}>
            <SelectTrigger id="app-category"><SelectValue /></SelectTrigger>
            <SelectContent>{APP_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="app-url">Sign-in link (https)</Label><Input id="app-url" type="url" placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="app-description">What it’s for</Label><Textarea id="app-description" rows={2} maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="app-default-for">Give to new joiners in</Label><Input id="app-default-for" placeholder="All, or departments: Engineering, Design" value={form.defaultFor} onChange={(e) => setForm({ ...form, defaultFor: e.target.value })} /></div>
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2"><Switch id="app-requires-approval" checked={form.requiresApproval} onCheckedChange={(requiresApproval) => setForm({ ...form, requiresApproval })} /><Label htmlFor="app-requires-approval">Requests need manager approval</Label></div>
        <div className="flex items-center gap-2"><Switch id="app-active" checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /><Label htmlFor="app-active">Show in catalogue</Label></div>
      </div>
      <DialogFooter><Button id="app-save" type="submit" disabled={busy || !form.name.trim()}>Save app</Button></DialogFooter>
    </form>
  );
}

export function AppDialog({ open, app, onOpenChange, onSubmit }: { open: boolean; app: AppView | null; onOpenChange: (open: boolean) => void; onSubmit: Submit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{app ? 'Edit app' : 'Add an app'}</DialogTitle><DialogDescription>Apps your team signs in to. Accounts are created in the app itself; this tracks who should have one.</DialogDescription></DialogHeader>
        {open && <AppForm app={app} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({ app, onSubmit, onDone }: { app: AppView; onSubmit: Submit; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const ok = await onSubmit({ appId: app.id, reason }); setBusy(false); if (ok) onDone(); }}>
      <div className="space-y-1.5"><Label htmlFor="app-request-reason">Why do you need it?{app.requiresApproval ? '' : ' (optional)'}</Label><Textarea id="app-request-reason" rows={3} maxLength={300} placeholder="e.g. Reviewing designs for the onboarding project" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      <p className="text-xs text-muted-foreground">{app.requiresApproval ? 'Your manager approves it, then the app’s admin sets up your account.' : 'No approval needed — the app’s admin will set up your account.'}</p>
      <DialogFooter><Button id="app-request-submit" type="submit" disabled={busy || (app.requiresApproval && !reason.trim())}>Request access</Button></DialogFooter>
    </form>
  );
}

export function RequestDialog({ app, onOpenChange, onSubmit }: { app: AppView | null; onOpenChange: (open: boolean) => void; onSubmit: Submit }) {
  return (
    <Dialog open={!!app} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request {app?.name}</DialogTitle></DialogHeader>
        {app && <RequestForm app={app} onSubmit={onSubmit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
