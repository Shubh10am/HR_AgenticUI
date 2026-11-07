'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Laptop, Loader2, Package, Plus, Search, Wrench } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatTile from '@/components/stat-tile';
import StatusPill, { type PillTone } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useOrgApi } from '@/hooks/use-org-api';
import { ASSET_STATUS_LABEL, type AssetStatus, type AssetView } from '@/lib/assets';
import AddAssetDialog from './components/add-asset-dialog';
import AssetRowActions from './components/asset-row-actions';

const TONE: Record<AssetStatus, PillTone> = { available: 'ok', assigned: 'info', repair: 'warn', retired: 'neutral' };

export default function AssetsPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [mine, setMine] = useState<AssetView[] | null>(null);
  const [register, setRegister] = useState<AssetView[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [history, setHistory] = useState<AssetView | null>(null);

  const load = useCallback(async () => {
    if (isGuest) return setMine([]);
    const [nextMine, nextRegister, org] = await Promise.all([
      run<AssetView[]>('/api/assets'),
      isPeopleTeam ? run<AssetView[]>('/api/assets?scope=all') : Promise.resolve([]),
      isPeopleTeam ? run<{ people: { id: string; name: string }[] }>('/api/hierarchy') : Promise.resolve(null),
    ]);
    setMine(nextMine ?? []);
    setRegister(nextRegister ?? []);
    if (org) setPeople(org.people.map(({ id, name }) => ({ id, name })));
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return register.filter((asset) => !needle || [asset.tag, asset.name, asset.serial, asset.category, asset.assignee?.name].join(' ').toLowerCase().includes(needle));
  }, [register, query]);

  const move = async (asset: AssetView, action: string, employeeId?: string, note?: string) => {
    const next = await run<AssetView[]>(`/api/assets/${asset.id}`, 'PATCH', { action, employeeId, note }, 'Asset updated');
    if (next) {
      setRegister(next);
      setMine((await run<AssetView[]>('/api/assets')) ?? []);
    }
  };

  return (
    <>
      <PageHeader title="Assets" description="Laptops, phones, ID cards and other equipment — who has what, and its history.">
        {isPeopleTeam && <Button id="asset-add" onClick={() => setAdding(true)} disabled={isGuest}><Plus /> Add equipment</Button>}
      </PageHeader>
      {isGuest && <GuestSampleNotice what="assets" />}
      {!mine ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <Tabs defaultValue={isPeopleTeam ? 'register' : 'mine'}>
          <TabsList>
            <TabsTrigger id="asset-tab-mine" value="mine">My equipment</TabsTrigger>
            {isPeopleTeam && <TabsTrigger id="asset-tab-register" value="register">Register</TabsTrigger>}
          </TabsList>
          <TabsContent value="mine" className="mt-4">
            {mine.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">No equipment is assigned to you.</Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mine.map((asset) => (
                  <Card key={asset.id} id={`my-asset-${asset.id}`} className="p-4">
                    <p className="text-xs font-semibold text-muted-foreground">{asset.tag} · {asset.category}</p>
                    <p className="mt-1 font-semibold">{asset.name}</p>
                    {asset.serial && <p className="text-xs text-muted-foreground">Serial {asset.serial}</p>}
                    {asset.assignedAt && <p className="mt-2 text-xs text-muted-foreground">With you since {format(new Date(asset.assignedAt), 'd MMM yyyy')}</p>}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          {isPeopleTeam && (
            <TabsContent value="register" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatTile id="asset-stat-assigned" icon={Laptop} label="Assigned" value={register.filter((a) => a.status === 'assigned').length} />
                <StatTile id="asset-stat-stock" icon={Package} label="In stock" value={register.filter((a) => a.status === 'available').length} />
                <StatTile id="asset-stat-repair" icon={Wrench} label="In repair" value={register.filter((a) => a.status === 'repair').length} />
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="asset-search" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tag, name, serial or person" />
              </div>
              <Card className="overflow-x-auto">
                <Table id="asset-register">
                  <TableHeader>
                    <TableRow>
                      <TableHead id="asset-register-tag-header">Tag</TableHead>
                      <TableHead id="asset-register-name-header">Equipment</TableHead>
                      <TableHead id="asset-register-status-header">Status</TableHead>
                      <TableHead id="asset-register-holder-header">With</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((asset) => (
                      <TableRow key={asset.id} id={`asset-register-${asset.id}-row`}>
                        <TableCell className="font-mono text-xs font-semibold">{asset.tag}</TableCell>
                        <TableCell><p className="font-medium">{asset.name}</p><p className="text-xs text-muted-foreground">{asset.category}{asset.serial ? ` · ${asset.serial}` : ''}</p></TableCell>
                        <TableCell><StatusPill tone={TONE[asset.status]}>{ASSET_STATUS_LABEL[asset.status]}</StatusPill></TableCell>
                        <TableCell>{asset.assignee ? <><p className="font-medium">{asset.assignee.name}</p><p className="text-xs text-muted-foreground">since {format(new Date(asset.assignedAt!), 'd MMM yyyy')}</p></> : '—'}</TableCell>
                        <TableCell><AssetRowActions asset={asset} people={people} onMove={(action, employeeId, note) => move(asset, action, employeeId, note)} onHistory={() => setHistory(asset)} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No equipment matches.</p>}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
      <AddAssetDialog open={adding} onOpenChange={setAdding} onSubmit={async (input) => { const next = await run<AssetView[]>('/api/assets', 'POST', input, 'Added to the register'); if (next) setRegister(next); return !!next; }} />
      <Sheet open={!!history} onOpenChange={(open) => !open && setHistory(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>{history?.tag} · {history?.name}</SheetTitle></SheetHeader>
          <ol className="mt-4 space-y-3 text-sm">
            {history?.history.map((entry, index) => (
              <li key={index} className="border-l-2 pl-3">
                <p className="font-medium capitalize">{entry.action}{entry.employeeName && entry.action !== 'added' ? ` · ${entry.employeeName}` : ''}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(entry.at), 'd MMM yyyy, p')}{entry.byName ? ` · by ${entry.byName}` : ''}</p>
                {entry.note && <p className="text-xs italic text-muted-foreground">{entry.note}</p>}
              </li>
            ))}
          </ol>
        </SheetContent>
      </Sheet>
    </>
  );
}
