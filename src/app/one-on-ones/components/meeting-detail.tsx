'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Lock, Plus, Trash2, Users, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusPill from '@/components/status-pill';
import type { OneOnOneView } from '@/lib/one-on-ones';

type Change = (op: string, input?: Record<string, unknown>, success?: string) => Promise<void>;

/** One 1:1: shared agenda, shared notes, the viewer's private notes and action items. */
export default function MeetingDetail({ meeting, onChange }: { meeting: OneOnOneView; onChange: Change }) {
  const [agendaText, setAgendaText] = useState('');
  const [actionText, setActionText] = useState('');
  const [actionOwner, setActionOwner] = useState(meeting.report.id);
  const [shared, setShared] = useState(meeting.sharedNotes);
  const [privateNotes, setPrivateNotes] = useState(meeting.myPrivateNotes);
  useEffect(() => {
    setShared(meeting.sharedNotes);
    setPrivateNotes(meeting.myPrivateNotes);
  }, [meeting.id, meeting.sharedNotes, meeting.myPrivateNotes]);

  const cancelled = meeting.status === 'cancelled';
  const dirty = shared !== meeting.sharedNotes || privateNotes !== meeting.myPrivateNotes;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">1:1 with {meeting.withPerson.name}</p>
            <p className="text-sm text-muted-foreground">{format(new Date(meeting.scheduledFor), 'EEEE d MMMM yyyy · h:mm a')}</p>
          </div>
          <StatusPill tone={meeting.status === 'completed' ? 'ok' : cancelled ? 'neutral' : 'info'}>{meeting.status === 'completed' ? 'Done' : cancelled ? 'Cancelled' : 'Upcoming'}</StatusPill>
          {meeting.status === 'scheduled' && (
            <>
              <Button id={`one-on-one-${meeting.id}-cancel`} size="sm" variant="ghost" onClick={() => void onChange('cancel', {}, '1:1 cancelled')}><XCircle /> Cancel</Button>
              <Button id={`one-on-one-${meeting.id}-complete`} size="sm" onClick={() => void onChange('complete', {}, '1:1 marked done')}><CheckCircle2 /> Mark done</Button>
            </>
          )}
          {meeting.status !== 'scheduled' && <Button id={`one-on-one-${meeting.id}-reopen`} size="sm" variant="outline" onClick={() => void onChange('reopen')}><RotateCcw /> Reopen</Button>}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" /> Shared agenda</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {meeting.agenda.length === 0 && <p className="text-sm text-muted-foreground">No topics yet. Either of you can add one.</p>}
            {meeting.agenda.map((item) => (
              <div key={item.id} id={`one-on-one-agenda-${item.id}`} className="group flex items-start gap-2">
                <Checkbox id={`one-on-one-agenda-${item.id}-done`} className="mt-0.5" checked={item.done} disabled={cancelled} onCheckedChange={() => void onChange('toggle-agenda', { itemId: item.id })} />
                <label htmlFor={`one-on-one-agenda-${item.id}-done`} className={`flex-1 text-sm ${item.done ? 'text-muted-foreground line-through' : ''}`}>{item.text}<span className="block text-xs text-muted-foreground no-underline">added by {item.addedByName}</span></label>
                {!cancelled && <Button id={`one-on-one-agenda-${item.id}-remove`} size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" aria-label="Remove topic" onClick={() => void onChange('remove-agenda', { itemId: item.id })}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
            ))}
            {!cancelled && (
              <form className="flex gap-2 pt-1" onSubmit={async (e) => { e.preventDefault(); if (!agendaText.trim()) return; await onChange('add-agenda', { text: agendaText }); setAgendaText(''); }}>
                <Input id={`one-on-one-${meeting.id}-agenda-input`} value={agendaText} maxLength={200} placeholder="Add a topic…" onChange={(e) => setAgendaText(e.target.value)} />
                <Button id={`one-on-one-${meeting.id}-agenda-add`} type="submit" size="icon" aria-label="Add topic"><Plus /></Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-primary" /> Action items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {meeting.actions.length === 0 && <p className="text-sm text-muted-foreground">Agree next steps and note who owns each one.</p>}
            {meeting.actions.map((item) => (
              <div key={item.id} id={`one-on-one-action-${item.id}`} className="group flex items-start gap-2">
                <Checkbox id={`one-on-one-action-${item.id}-done`} className="mt-0.5" checked={item.done} disabled={cancelled} onCheckedChange={() => void onChange('toggle-action', { itemId: item.id })} />
                <label htmlFor={`one-on-one-action-${item.id}-done`} className={`flex-1 text-sm ${item.done ? 'text-muted-foreground line-through' : ''}`}>{item.text}<span className="block text-xs text-muted-foreground">owner: {item.ownerName}</span></label>
                {!cancelled && <Button id={`one-on-one-action-${item.id}-remove`} size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" aria-label="Remove action" onClick={() => void onChange('remove-action', { itemId: item.id })}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
            ))}
            {!cancelled && (
              <form className="flex flex-wrap gap-2 pt-1" onSubmit={async (e) => { e.preventDefault(); if (!actionText.trim()) return; await onChange('add-action', { text: actionText, ownerId: actionOwner }); setActionText(''); }}>
                <Input id={`one-on-one-${meeting.id}-action-input`} className="min-w-[160px] flex-1" value={actionText} maxLength={200} placeholder="Add an action…" onChange={(e) => setActionText(e.target.value)} />
                <Select value={actionOwner} onValueChange={setActionOwner}>
                  <SelectTrigger id={`one-on-one-${meeting.id}-action-owner`} className="w-36" aria-label="Owner"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={meeting.report.id}>{meeting.report.name.split(' ')[0]}</SelectItem>
                    <SelectItem value={meeting.manager.id}>{meeting.manager.name.split(' ')[0]}</SelectItem>
                  </SelectContent>
                </Select>
                <Button id={`one-on-one-${meeting.id}-action-add`} type="submit" size="icon" aria-label="Add action"><Plus /></Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Shared notes</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            <Label htmlFor={`one-on-one-${meeting.id}-shared-notes`} className="sr-only">Shared notes</Label>
            <Textarea id={`one-on-one-${meeting.id}-shared-notes`} rows={6} maxLength={5000} disabled={cancelled} placeholder="What you discussed. Both of you can see and edit this." value={shared} onChange={(e) => setShared(e.target.value)} />
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-muted-foreground" /> My private notes</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            <Label htmlFor={`one-on-one-${meeting.id}-private-notes`} className="sr-only">Private notes</Label>
            <Textarea id={`one-on-one-${meeting.id}-private-notes`} rows={6} maxLength={5000} disabled={cancelled} placeholder={`Only you can see these — not ${meeting.withPerson.name.split(' ')[0]}, not HR.`} value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} />
          </CardContent>
        </Card>
      </div>
      {!cancelled && (
        <div className="flex justify-end">
          <Button id={`one-on-one-${meeting.id}-save-notes`} disabled={!dirty} onClick={() => void onChange('notes', { sharedNotes: shared, privateNotes }, 'Notes saved')}>Save notes</Button>
        </div>
      )}
    </div>
  );
}
