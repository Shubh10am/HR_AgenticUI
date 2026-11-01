import { CheckCircle2, Clock, Link as LinkIcon, Loader2, Send, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IntegrationDefinition } from '../catalog';
import IntegrationLogo from './integration-logo';

export type GoogleState = 'unknown' | 'connected' | 'disconnected' | 'connecting' | 'disconnecting';

interface Props {
  integration: IntegrationDefinition;
  googleState: GoogleState;
  isRequested: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRequest: () => void;
}

function Status({ integration, googleState, isRequested }: Pick<Props, 'integration' | 'googleState' | 'isRequested'>) {
  if (integration.availability === 'google') {
    if (googleState === 'connected') return <Badge className="gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" />Connected</Badge>;
    if (googleState === 'connecting' || googleState === 'disconnecting') return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />{googleState === 'connecting' ? 'Connecting' : 'Disconnecting'}</Badge>;
    return <Badge variant="outline">Not connected</Badge>;
  }
  return isRequested
    ? <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Requested</Badge>
    : <Badge variant="outline" className="gap-1 text-muted-foreground"><Clock className="h-3 w-3" />Coming soon</Badge>;
}

export default function IntegrationCard({ integration, googleState, isRequested, onConnect, onDisconnect, onRequest }: Props) {
  const busy = googleState === 'connecting' || googleState === 'disconnecting';
  return (
    <Card id={`integration-${integration.id}`} className="flex flex-col shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start gap-3">
          <IntegrationLogo integration={integration} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-tight" title={integration.name}>{integration.name}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">{integration.category}</p>
          </div>
          {integration.popular && <Badge variant="secondary" className="shrink-0 text-[10px]">Popular</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{integration.description}</p>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <ul className="space-y-1.5 text-xs">
          {integration.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />{feature}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t pt-4">
        <Status integration={integration} googleState={googleState} isRequested={isRequested} />
        {integration.availability === 'google' ? (
          googleState === 'connected' || googleState === 'disconnecting' ? (
            <Button id={`integration-${integration.id}-disconnect`} size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={onDisconnect} disabled={busy}>
              <Trash2 className="mr-1.5 h-4 w-4" />Disconnect
            </Button>
          ) : (
            <Button id={`integration-${integration.id}-connect`} size="sm" onClick={onConnect} disabled={busy || googleState === 'unknown'}>
              <LinkIcon className="mr-1.5 h-4 w-4" />Connect
            </Button>
          )
        ) : (
          <Button id={`integration-${integration.id}-request`} size="sm" variant="outline" onClick={onRequest} disabled={isRequested}>
            <Send className="mr-1.5 h-4 w-4" />{isRequested ? 'Requested' : 'Request'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
