'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { AssetView } from '@/lib/assets';

/** The actions available for one asset in its current state. */
export default function AssetRowActions({ asset, people, onMove, onHistory }: { asset: AssetView; people: { id: string; name: string }[]; onMove: (action: string, employeeId?: string, note?: string) => Promise<unknown>; onHistory: () => void }) {
  const [assigning, setAssigning] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [note, setNote] = useState('');
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button id={`asset-${asset.id}-menu`} variant="ghost" size="icon" aria-label={`Actions for ${asset.tag}`}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {asset.status === 'available' && <DropdownMenuItem id={`asset-${asset.id}-assign`} onClick={() => setAssigning(true)}>Assign to someone</DropdownMenuItem>}
          {asset.status === 'assigned' && <DropdownMenuItem id={`asset-${asset.id}-return`} onClick={() => void onMove('return')}>Mark returned</DropdownMenuItem>}
          {asset.status === 'available' && <DropdownMenuItem id={`asset-${asset.id}-repair`} onClick={() => void onMove('repair')}>Send for repair</DropdownMenuItem>}
          {(asset.status === 'repair' || asset.status === 'retired') && <DropdownMenuItem id={`asset-${asset.id}-restock`} onClick={() => void onMove('restock')}>Back in stock</DropdownMenuItem>}
          {(asset.status === 'available' || asset.status === 'repair') && <DropdownMenuItem id={`asset-${asset.id}-retire`} onClick={() => void onMove('retire')}>Retire</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem id={`asset-${asset.id}-history`} onClick={onHistory}>History</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={assigning} onOpenChange={setAssigning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign {asset.tag}</DialogTitle></DialogHeader>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger id={`asset-${asset.id}-assignee`} aria-label="Assign to"><SelectValue placeholder="Choose a person" /></SelectTrigger>
            <SelectContent>{people.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input id={`asset-${asset.id}-note`} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. with charger" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssigning(false)}>Cancel</Button>
            <Button id={`asset-${asset.id}-assign-confirm`} disabled={!employeeId} onClick={async () => { await onMove('assign', employeeId, note); setAssigning(false); }}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
