'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Coins, Gift, Loader2, Medal, Pencil, Plus, Sparkles, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import StatTile from '@/components/stat-tile';
import StatusPill, { type PillTone } from '@/components/status-pill';
import PersonAvatar from '@/components/person-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgApi } from '@/hooks/use-org-api';
import { KUDOS_POINTS, type RedemptionStatus, type RedemptionView, type RewardItemView, type RewardsOverview } from '@/lib/rewards';
import { AwardDialog, RewardItemDialog } from './components/reward-forms';

const TONE: Record<RedemptionStatus, PillTone> = { requested: 'warn', fulfilled: 'ok', declined: 'bad' };
const STATUS_LABEL: Record<RedemptionStatus, string> = { requested: 'Requested', fulfilled: 'Delivered', declined: 'Declined · refunded' };

export default function RewardsPage() {
  const { run, isGuest, authLoading, isPeopleTeam } = useOrgApi();
  const [data, setData] = useState<RewardsOverview | null>(null);
  const [requests, setRequests] = useState<RedemptionView[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<{ item: RewardItemView | null } | null>(null);
  const [awarding, setAwarding] = useState(false);

  const load = useCallback(async () => {
    if (isGuest) return setData({ balance: 0, earnedThisMonth: 0, history: [], items: [], leaders: [] });
    const [overview, redemptions, org] = await Promise.all([
      run<RewardsOverview>('/api/rewards'),
      isPeopleTeam ? run<RedemptionView[]>('/api/rewards/redemptions') : Promise.resolve([]),
      isPeopleTeam ? run<{ people: { id: string; name: string }[] }>('/api/hierarchy') : Promise.resolve(null),
    ]);
    setData(overview);
    setRequests(redemptions ?? []);
    setPeople(org?.people ?? []);
  }, [isGuest, isPeopleTeam, run]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const pending = requests.filter((request) => request.status === 'requested');

  return (
    <>
      <PageHeader title="Rewards" description={`Earn ${KUDOS_POINTS} points every time a colleague gives you kudos, then spend them on rewards.`}>
        {isPeopleTeam && (
          <>
            <Button id="rewards-award" variant="outline" onClick={() => setAwarding(true)} disabled={isGuest}><Sparkles /> Award points</Button>
            <Button id="rewards-add-item" onClick={() => setEditing({ item: null })} disabled={isGuest}><Plus /> Add reward</Button>
          </>
        )}
      </PageHeader>
      {isGuest && <GuestSampleNotice what="rewards" />}
      {!data ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Loading…</div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatTile id="rewards-balance" icon={Coins} label="Your points" value={data.balance.toLocaleString()} hint="Ready to spend" />
            <StatTile id="rewards-earned" icon={TrendingUp} label="Earned this month" value={data.earnedThisMonth.toLocaleString()} />
            <StatTile id="rewards-catalogue-count" icon={Gift} label="Rewards available" value={data.items.filter((item) => item.active).length} />
          </div>
          <Tabs defaultValue="catalogue">
            <TabsList>
              <TabsTrigger id="rewards-tab-catalogue" value="catalogue">Catalogue</TabsTrigger>
              <TabsTrigger id="rewards-tab-history" value="history">My points</TabsTrigger>
              {isPeopleTeam && <TabsTrigger id="rewards-tab-requests" value="requests">Requests{pending.length ? ` (${pending.length})` : ''}</TabsTrigger>}
            </TabsList>
            <TabsContent value="catalogue" className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.length === 0 && <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">No rewards yet.{isPeopleTeam ? ' Add the first one.' : ' HR will add some soon.'}</Card>}
                {data.items.map((item) => {
                  const short = data.balance < item.cost;
                  const soldOut = item.stock === 0;
                  return (
                    <Card key={item.id} id={`reward-item-${item.id}`} className={item.active ? '' : 'opacity-60'}>
                      <CardContent className="flex h-full flex-col gap-3 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Gift className="h-5 w-5" /></span>
                          {isPeopleTeam && <Button id={`reward-item-${item.id}-edit`} size="icon" variant="ghost" aria-label={`Edit ${item.name}`} onClick={() => setEditing({ item })}><Pencil /></Button>}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg font-bold">{item.cost.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">pts</span></span>
                          <span className="text-xs text-muted-foreground">{!item.active ? 'Hidden' : item.stock === null ? 'Always available' : `${item.stock} left`}</span>
                        </div>
                        <Button
                          id={`reward-item-${item.id}-redeem`}
                          disabled={isGuest || short || soldOut || !item.active}
                          onClick={async () => { if (window.confirm(`Spend ${item.cost} points on ${item.name}?`)) { const next = await run<RewardsOverview>('/api/rewards', 'POST', { itemId: item.id }, 'Reward requested — HR will be in touch'); if (next) { setData(next); if (isPeopleTeam) void load(); } } }}
                        >
                          {soldOut ? 'Out of stock' : short ? `${(item.cost - data.balance).toLocaleString()} more points needed` : 'Redeem'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Card className="h-fit">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Medal className="h-4 w-4 text-primary" /> Top this month</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data.leaders.length === 0 && <p className="text-sm text-muted-foreground">No points earned yet this month. Give someone kudos!</p>}
                  {data.leaders.map((leader, index) => (
                    <div key={leader.person.id} id={`rewards-leader-${leader.person.id}`} className="flex items-center gap-3">
                      <span className="w-4 text-sm font-bold text-muted-foreground">{index + 1}</span>
                      <PersonAvatar person={leader.person} className="h-8 w-8" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{leader.person.name}</p><p className="truncate text-xs text-muted-foreground">{leader.person.department}</p></div>
                      <span className="text-sm font-semibold">{leader.points}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              {data.history.length === 0 ? (
                <Card className="p-10 text-center text-sm text-muted-foreground">No points yet. You’ll earn {KUDOS_POINTS} each time a colleague gives you kudos in the Community.</Card>
              ) : (
                <Card className="divide-y">
                  {data.history.map((txn) => (
                    <div key={txn.id} id={`rewards-txn-${txn.id}`} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{txn.reason}</p><p className="text-xs text-muted-foreground">{format(new Date(txn.at), 'd MMM yyyy')}</p></div>
                      {txn.status && <StatusPill tone={TONE[txn.status]}>{STATUS_LABEL[txn.status]}</StatusPill>}
                      <span className={`w-20 text-right font-semibold ${txn.points > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>{txn.points > 0 ? '+' : ''}{txn.points}</span>
                    </div>
                  ))}
                </Card>
              )}
            </TabsContent>
            {isPeopleTeam && (
              <TabsContent value="requests" className="mt-4">
                {requests.length === 0 ? (
                  <Card className="p-10 text-center text-sm text-muted-foreground">No reward requests yet.</Card>
                ) : (
                  <Card className="divide-y">
                    {requests.map((request) => (
                      <div key={request.id} id={`rewards-request-${request.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <PersonAvatar person={request.employee} className="h-8 w-8" />
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium">{request.employee.name} · {request.itemName}</p><p className="text-xs text-muted-foreground">{-request.points} points · {format(new Date(request.at), 'd MMM yyyy')}</p></div>
                        {request.status === 'requested' ? (
                          <>
                            <Button id={`rewards-request-${request.id}-decline`} size="sm" variant="ghost" onClick={async () => { const next = await run<RedemptionView[]>('/api/rewards/redemptions', 'PATCH', { id: request.id, decision: 'declined' }, 'Declined and refunded'); if (next) setRequests(next); }}>Decline</Button>
                            <Button id={`rewards-request-${request.id}-fulfil`} size="sm" onClick={async () => { const next = await run<RedemptionView[]>('/api/rewards/redemptions', 'PATCH', { id: request.id, decision: 'fulfilled' }, 'Marked as delivered'); if (next) setRequests(next); }}>Mark delivered</Button>
                          </>
                        ) : (
                          <StatusPill tone={TONE[request.status!]}>{STATUS_LABEL[request.status!]}</StatusPill>
                        )}
                      </div>
                    ))}
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
      <RewardItemDialog open={!!editing} item={editing?.item ?? null} onOpenChange={(open) => !open && setEditing(null)} onSubmit={async (input) => { const next = await run<RewardsOverview>('/api/rewards/items', 'POST', input, 'Reward saved'); if (next) setData(next); return !!next; }} />
      <AwardDialog open={awarding} people={people} onOpenChange={setAwarding} onSubmit={async (input) => { const ok = await run('/api/rewards/award', 'POST', input, 'Points awarded'); if (ok) await load(); return !!ok; }} />
    </>
  );
}
