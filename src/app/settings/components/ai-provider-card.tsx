'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, PlugZap, Sparkles, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { AI_PROVIDERS, getProvider, type AiProviderId } from '@/ai/providers';

interface AiSettingsView {
  provider: AiProviderId;
  model: string;
  baseURL: string | null;
  keyHint: string | null;
  source: 'organization' | 'legacy-google' | 'platform';
  updatedBy: string | null;
  updatedAt: string | null;
}

interface TestResult { ok: boolean; latencyMs?: number; message: string }

const SOURCE_LABEL: Record<AiSettingsView['source'], string> = {
  organization: 'Your own key',
  'legacy-google': 'Your own Google key',
  platform: 'Platform default',
};

/** Lets an organization admin bring their own AI provider, model and key. */
export default function AiProviderCard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState<AiSettingsView | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [provider, setProvider] = useState<AiProviderId>('google');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<'test' | 'save' | 'reset' | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const definition = getProvider(provider)!;
  const isSameProvider = current?.source !== 'platform' && current?.provider === provider;
  const keyRequired = !isSameProvider || !current?.keyHint;

  const applyView = useCallback((view: AiSettingsView) => {
    setCurrent(view);
    setProvider(view.provider);
    setModel(view.model);
    setBaseURL(view.baseURL ?? '');
    setApiKey('');
    setTestResult(null);
  }, []);

  useEffect(() => {
    if (!token || token.startsWith('guest-')) return;
    fetch('/api/settings/ai-provider', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? 'Could not load AI settings.');
        applyView(body.settings);
        setCanEdit(Boolean(body.canEdit));
      })
      .catch((error) => setLoadError(error.message));
  }, [token, applyView]);

  const isDirty = useMemo(() => Boolean(current && (provider !== current.provider || model !== current.model || apiKey || (baseURL || '') !== (current.baseURL ?? '') || current.source === 'platform')), [current, provider, model, apiKey, baseURL]);

  const chooseProvider = (id: AiProviderId) => {
    setProvider(id);
    setModel(id === current?.provider ? current.model : getProvider(id)!.defaultModel);
    setApiKey('');
    setTestResult(null);
  };

  const send = async (method: 'POST' | 'PUT' | 'DELETE') => {
    const url = method === 'POST' ? '/api/settings/ai-provider?action=test' : '/api/settings/ai-provider';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: method === 'DELETE' ? undefined : JSON.stringify({ provider, model: model.trim(), apiKey: apiKey.trim() || undefined, baseURL: baseURL.trim() || undefined }),
    });
    return { response, body: await response.json().catch(() => ({})) };
  };

  const testConnection = async () => {
    setBusy('test');
    setTestResult(null);
    try {
      const { body } = await send('POST');
      setTestResult({ ok: Boolean(body.ok), latencyMs: body.latencyMs, message: body.message ?? body.error ?? 'Test failed.' });
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy('save');
    try {
      const { response, body } = await send('PUT');
      if (!response.ok) {
        setTestResult({ ok: false, message: body.error ?? 'Could not save.' });
        return;
      }
      applyView(body.settings);
      toast({ title: 'AI provider saved', description: `${definition.label} · ${body.settings.model} is now used for every AI feature.` });
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    if (!window.confirm('Remove your own AI key and go back to the platform default (Gemini)?')) return;
    setBusy('reset');
    try {
      const { response, body } = await send('DELETE');
      if (response.ok) {
        applyView(body.settings);
        toast({ title: 'Back to the platform default', description: 'Your stored key has been removed.' });
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" /> AI Provider</CardTitle>
        <CardDescription>Choose which AI model powers Copilot, email drafts, recruitment tools and Knowledge Base answers — and bring your own API key.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loadError ? <p className="text-sm text-destructive">{loadError}</p> : !current ? <Skeleton className="h-40 w-full" /> : (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">In use:</span>
              <span className="font-semibold">{getProvider(current.provider)?.label}</span>
              <Badge variant="secondary" className="font-mono font-normal">{current.model}</Badge>
              <Badge variant={current.source === 'platform' ? 'outline' : 'default'}>{SOURCE_LABEL[current.source]}{current.keyHint && ` ${current.keyHint}`}</Badge>
              {current.updatedAt && <span className="text-xs text-muted-foreground">· changed {format(new Date(current.updatedAt), 'd MMM yyyy')}{current.updatedBy && ` by ${current.updatedBy}`}</span>}
            </div>

            {!canEdit ? (
              <p className="text-sm text-muted-foreground">Only organization admins can change the AI provider.</p>
            ) : (
              <>
                <div>
                  <Label className="mb-2 block">Provider</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {AI_PROVIDERS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        id={`settings-ai-provider-${option.id}`}
                        onClick={() => chooseProvider(option.id)}
                        aria-pressed={provider === option.id}
                        className={cn('rounded-lg border p-3 text-left transition-colors hover:border-primary/50', provider === option.id && 'border-primary bg-primary/5 ring-1 ring-primary/30')}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{option.vendor}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {provider === 'custom' && (
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="settings-ai-base-url">API endpoint</Label>
                      <Input id="settings-ai-base-url" value={baseURL} onChange={(event) => setBaseURL(event.target.value)} placeholder="https://api.example.com/v1" />
                      <p className="text-xs text-muted-foreground">Any OpenAI-compatible endpoint (Together, Fireworks, Azure OpenAI, a self-hosted gateway…). Must be public HTTPS.</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-ai-model">Model</Label>
                    {definition.suggestedModels.length > 0 ? (
                      <Select value={definition.suggestedModels.includes(model) ? model : '__custom'} onValueChange={(value) => setModel(value === '__custom' ? '' : value)}>
                        <SelectTrigger id="settings-ai-model"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {definition.suggestedModels.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          <SelectItem value="__custom">Other model ID…</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}
                    {(!definition.suggestedModels.includes(model) || definition.suggestedModels.length === 0) && (
                      <Input id="settings-ai-model-custom" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model ID as your provider names it" className="font-mono" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-ai-key">API key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="settings-ai-key"
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        placeholder={!keyRequired && current.keyHint ? `Saved key ${current.keyHint} — leave blank to keep it` : definition.keyPlaceholder}
                        autoComplete="off"
                        className="font-mono"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setShowKey((shown) => !shown)} aria-label={showKey ? 'Hide key' : 'Show key'}>
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {definition.keyUrl && (
                      <a href={definition.keyUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Get a {definition.vendor} key <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {testResult && (
                  <Alert variant={testResult.ok ? 'default' : 'destructive'} className={testResult.ok ? 'border-emerald-500/50' : undefined}>
                    {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4" />}
                    <AlertDescription className="break-words">{testResult.message}{testResult.ok && testResult.latencyMs !== undefined && ` (${(testResult.latencyMs / 1000).toFixed(1)}s)`}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button id="settings-ai-test" variant="outline" onClick={testConnection} disabled={Boolean(busy) || !model.trim() || (keyRequired && !apiKey.trim())}>
                    {busy === 'test' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}Test connection
                  </Button>
                  <Button id="settings-ai-save" onClick={save} disabled={Boolean(busy) || !isDirty || !model.trim() || (keyRequired && !apiKey.trim())}>
                    {busy === 'save' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save &amp; use for all AI features
                  </Button>
                  {current.source !== 'platform' && (
                    <Button id="settings-ai-reset" variant="ghost" onClick={reset} disabled={Boolean(busy)}>
                      {busy === 'reset' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Use platform default
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saving runs a quick test first, so a wrong key can&apos;t break AI for your team. Keys are encrypted and never sent back to the browser.
                  Knowledge Base search indexing always uses Gemini, so existing documents stay searchable when you switch providers.
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
