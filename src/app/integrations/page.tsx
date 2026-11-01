'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plug, Search, Send } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { isGuestToken } from '@/lib/guest-demo';
import { CATEGORIES, INTEGRATIONS } from './catalog';
import IntegrationCard, { type GoogleState } from './components/integration-card';
import RequestDialog from './components/request-dialog';

const REQUESTED_KEY = 'integrationRequests';
type Filter = 'All' | 'Available now' | (typeof CATEGORIES)[number];

export default function IntegrationsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = isGuestToken(token);

  const [googleState, setGoogleState] = useState<GoogleState>('unknown');
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const [requested, setRequested] = useState<string[]>([]);
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    try { setRequested(JSON.parse(localStorage.getItem(REQUESTED_KEY) ?? '[]')); } catch { setRequested([]); }
  }, []);

  const checkGoogle = useCallback(async () => {
    if (isGuest) { setGoogleState('disconnected'); return; }
    try {
      const response = await fetch('/api/google-auth/status', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      setGoogleState(response.ok && data.isAuthenticated ? 'connected' : 'disconnected');
    } catch {
      setGoogleState('disconnected');
    }
  }, [isGuest, token]);

  useEffect(() => {
    checkGoogle();
    if (searchParams?.get('connect') === 'success') {
      toast({ title: 'Google connected', description: 'Gmail, Calendar and Meet are now linked to your account.' });
      router.replace('/integrations');
    }
  }, [checkGoogle, searchParams, toast, router]);

  const connectGoogle = () => {
    if (isGuest) { setShowSignIn(true); return; }
    setGoogleState('connecting');
    // The OAuth route reads the session from this short-lived cookie.
    document.cookie = `authToken=${token}; path=/; max-age=300`;
    window.location.href = '/api/google-auth/connect';
  };

  const disconnectGoogle = async () => {
    setGoogleState('disconnecting');
    try {
      const response = await fetch('/api/google-auth/disconnect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not disconnect.');
      setGoogleState('disconnected');
      toast({ title: 'Google disconnected', description: 'Gmail, Calendar and Meet are no longer linked.' });
    } catch (error) {
      setGoogleState('connected');
      toast({ title: 'Disconnect failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const openRequest = (name: string) => {
    if (isGuest) { setShowSignIn(true); return; }
    setRequestFor(name);
  };

  const markRequested = (name: string) => {
    const match = INTEGRATIONS.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (!match) return;
    const next = Array.from(new Set([...requested, match.id]));
    setRequested(next);
    localStorage.setItem(REQUESTED_KEY, JSON.stringify(next));
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTEGRATIONS.filter((i) =>
      (filter === 'All' || (filter === 'Available now' ? i.availability === 'google' : i.category === filter)) &&
      (!q || `${i.name} ${i.category} ${i.description} ${i.features.join(' ')}`.toLowerCase().includes(q))
    );
  }, [filter, query]);

  const liveCount = INTEGRATIONS.filter((i) => i.availability === 'google').length;
  const filters: Filter[] = ['All', 'Available now', ...CATEGORIES];

  return (
    <>
      <PageHeader title="Manage Integrations" description="Connect the tools your HR team already uses." />

      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plug className="h-5 w-5" /></span>
            <div>
              <CardTitle className="text-base">{INTEGRATIONS.length} integrations · {liveCount} available now</CardTitle>
              <CardDescription>
                {googleState === 'connected' ? 'Your Google account is connected.' : 'Connect Google to use Gmail, Calendar and Meet.'} Request any other tool to move it up our roadmap.
              </CardDescription>
            </div>
          </div>
          <div className="relative sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input id="integrations-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools or features…" className="pl-8" />
          </div>
        </CardHeader>
      </Card>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter integrations">
        {filters.map((f) => {
          const count = f === 'All' ? INTEGRATIONS.length : f === 'Available now' ? liveCount : INTEGRATIONS.filter((i) => i.category === f).length;
          return (
            <Button key={f} id={`integrations-filter-${f.toLowerCase().replace(/[^a-z]+/g, '-')}`} role="tab" aria-selected={filter === f}
              size="sm" variant={filter === f ? 'default' : 'outline'} className="h-8 rounded-full" onClick={() => setFilter(f)}>
              {f} <span className="ml-1 opacity-70">{count}</span>
            </Button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No integrations match “{query}”.{' '}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => openRequest(query.trim())}>Request it</button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              googleState={googleState}
              isRequested={requested.includes(integration.id)}
              onConnect={connectGoogle}
              onDisconnect={disconnectGoogle}
              onRequest={() => openRequest(integration.name)}
            />
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Don&apos;t see your tool?</CardTitle>
            <CardDescription>Tell us what you use and we&apos;ll prioritise it.</CardDescription>
          </div>
          <Button id="integrations-request-other" onClick={() => openRequest('')}><Send className="mr-2 h-4 w-4" />Request an integration</Button>
        </CardHeader>
      </Card>

      {token && (
        <RequestDialog open={requestFor !== null} integrationName={requestFor ?? ''} token={token} onClose={() => setRequestFor(null)} onRequested={markRequested} />
      )}

      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to connect tools</DialogTitle>
            <DialogDescription>Guests can browse integrations. Sign in or register to connect Google or request a tool.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button asChild variant="outline"><Link href="/register">Register</Link></Button>
            <Button asChild><Link href="/login">Log in</Link></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
