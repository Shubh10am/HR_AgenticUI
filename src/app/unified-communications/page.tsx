'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { CommItem, CommSourceStatus } from '@/lib/communications';
import SourcesCard from './components/sources-card';
import CommLog from './components/comm-log';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { demoCommunications, isGuestToken } from '@/lib/guest-demo';

export default function UnifiedCommunicationsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CommItem[] | null>(null);
  const [sources, setSources] = useState<CommSourceStatus[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isGuest = isGuestToken(token);

  const load = useCallback(async () => {
    if (!token) return;
    if (isGuest) {
      const demo = demoCommunications();
      setItems(demo.items);
      setSources(demo.sources);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/communications', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load communications.');
      setItems(data.items);
      setSources(data.sources);
    } catch (error) {
      toast({ title: 'Could not load communications', description: (error as Error).message, variant: 'destructive' });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, toast, isGuest]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Unified Communications Hub"
        description="Your email, meetings and team conversations in one place."
      >
        <Button id="comms-refresh" variant="outline" onClick={load} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </PageHeader>
      {isGuest && <GuestSampleNotice what="the communications hub" />}
      <SourcesCard sources={sources} />
      <CommLog items={items} isLoading={isLoading} />
    </>
  );
}
