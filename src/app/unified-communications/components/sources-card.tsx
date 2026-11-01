import Link from 'next/link';
import { AlertTriangle, CalendarDays, CheckCircle2, Mail, MessageCircle, PlugZap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CommSourceStatus } from '@/lib/communications';

const ICONS = { gmail: Mail, calendar: CalendarDays, community: MessageCircle };

export default function SourcesCard({ sources }: { sources: CommSourceStatus[] | null }) {
  const connected = sources?.filter((s) => s.state === 'connected').length ?? 0;
  const needsGoogle = sources?.some((s) => s.state !== 'connected');
  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Connected Sources</CardTitle>
          <CardDescription>
            {sources ? `${connected} of ${sources.length} sources feeding this hub.` : 'Checking your connections…'}
          </CardDescription>
        </div>
        {needsGoogle && (
          <Button asChild size="sm" variant="outline" id="comms-connect-google">
            <Link href="/integrations"><PlugZap className="mr-2 h-4 w-4" />Connect Google</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {!sources
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : sources.map((source) => {
              const Icon = ICONS[source.id];
              return (
                <div key={source.id} id={`comms-source-${source.id}`} className="flex items-start gap-3 rounded-lg border p-3">
                  <Icon className="mt-0.5 h-5 w-5 text-primary" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{source.label}</p>
                    {source.state === 'connected' ? (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-green-500" />{source.count} recent items</p>
                    ) : source.state === 'error' ? (
                      <p className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />{source.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not connected. Sign in with Google in Integrations.</p>
                    )}
                  </div>
                </div>
              );
            })}
      </CardContent>
    </Card>
  );
}
