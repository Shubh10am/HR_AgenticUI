'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Loader2, PenLine } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AckStatusView, PolicyDocView } from '@/lib/documents';

interface Props {
  policy: PolicyDocView | null;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (name: string) => Promise<boolean>;
  onSave: (input: { title: string; body: string }) => Promise<boolean>;
  loadStatus: () => Promise<AckStatusView | null>;
}

/** Read and sign a policy; HR and admins can also edit it and see who has signed. */
export default function PolicySheet({ policy, canManage, onOpenChange, onSign, onSave, loadStatus }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<AckStatusView | null>(null);

  useEffect(() => {
    setName('');
    setTitle(policy?.title ?? '');
    setBody(policy?.body ?? '');
    setStatus(null);
    if (policy && canManage) void loadStatus().then(setStatus);
  }, [policy, canManage, loadStatus]);

  return (
    <Sheet open={!!policy} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {policy && (
          <>
            <SheetHeader>
              <SheetTitle>{policy.title}</SheetTitle>
              <SheetDescription>Version {policy.version} · updated {format(new Date(policy.updatedAt), 'd MMM yyyy')}</SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="read" className="mt-4">
              {canManage && (
                <TabsList>
                  <TabsTrigger id="policy-tab-read" value="read">Read & sign</TabsTrigger>
                  <TabsTrigger id="policy-tab-status" value="status">Who signed</TabsTrigger>
                  <TabsTrigger id="policy-tab-edit" value="edit">Edit</TabsTrigger>
                </TabsList>
              )}
              <TabsContent value="read" className="space-y-4">
                <div className="whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 text-sm leading-relaxed">{policy.body}</div>
                {policy.requiresAck &&
                  (policy.myAck ? (
                    <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Signed as &ldquo;{policy.myAck.signedName}&rdquo; on {format(new Date(policy.myAck.at), 'd MMM yyyy, p')}</p>
                  ) : (
                    <div className="space-y-2 rounded-xl border p-4">
                      <Label htmlFor="policy-sign-name" className="flex items-center gap-2"><PenLine className="h-4 w-4" /> Type your full name to confirm you have read and agree to this policy</Label>
                      <div className="flex gap-2">
                        <Input id="policy-sign-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="font-serif italic" />
                        <Button id="policy-sign-submit" disabled={!name.trim() || busy} onClick={async () => { setBusy(true); await onSign(name); setBusy(false); }}>
                          {busy && <Loader2 className="animate-spin" />} Sign
                        </Button>
                      </div>
                    </div>
                  ))}
              </TabsContent>
              {canManage && (
                <TabsContent value="status" className="space-y-4">
                  {!status ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">{status.signed.length} signed · {status.pending.length} still to sign (version {policy.version})</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-sm font-semibold">Still to sign</p>
                          <ul className="space-y-1 text-sm">{status.pending.map((person) => <li key={person.id}>{person.name} <span className="text-muted-foreground">· {person.department}</span></li>)}</ul>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-semibold">Signed</p>
                          <ul className="space-y-1 text-sm">{status.signed.map((person) => <li key={person.id}>{person.name} <span className="text-muted-foreground">· {format(new Date(person.at), 'd MMM')}</span></li>)}</ul>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              )}
              {canManage && (
                <TabsContent value="edit" className="space-y-3">
                  <Input id="policy-edit-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
                  <Textarea id="policy-edit-body" rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Changing the text starts version {policy.version + 1}, and everyone is asked to sign again.</p>
                  <Button id="policy-edit-save" disabled={busy || !title.trim() || !body.trim()} onClick={async () => { setBusy(true); await onSave({ title, body }); setBusy(false); }}>
                    {busy && <Loader2 className="animate-spin" />} Save
                  </Button>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
