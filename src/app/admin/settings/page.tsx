'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Bell, CheckCircle2, CircleSlash, KeyRound, Loader2, Send, Shield } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { PlatformSettingsData } from '@/services/platform/settings';
import { useAdminData } from '../components/use-admin-data';
import { TextSetting, ToggleSetting } from './components/setting-fields';

type Settings = PlatformSettingsData & { updatedAt?: string };
interface SettingsResponse {
  settings: Settings;
  environment: { googleApiKey: boolean; brevoApiKey: boolean; encryptionKey: boolean };
}

const EDITABLE: (keyof Settings)[] = ['appName', 'supportEmail', 'maintenanceMode', 'maintenanceMessage', 'senderName', 'senderEmail', 'adminNotificationEmail', 'notifyOnNewOrganization', 'notifyOnContact', 'notifyOnDemoRequest', 'slackWebhookUrl'];

function EnvStatus({ label, isSet, purpose }: { label: string; isSet: boolean; purpose: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div>
        <p className="font-mono text-sm font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{purpose}</p>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 text-sm font-medium ${isSet ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
        {isSet ? <CheckCircle2 className="h-4 w-4" /> : <CircleSlash className="h-4 w-4" />}{isSet ? 'Set' : 'Not set'}
      </span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { data, error, reload } = useAdminData<SettingsResponse>('/api/admin/settings');
  const [form, setForm] = useState<Settings | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);

  useEffect(() => { if (data) setForm(data.settings); }, [data]);

  const isDirty = useMemo(() => Boolean(form && data && EDITABLE.some((key) => form[key] !== data.settings[key])), [form, data]);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setFieldErrors((current) => { const { [key as string]: _removed, ...rest } = current; return rest; });
  };

  const save = async () => {
    if (!form || !data) return;
    const changes = Object.fromEntries(EDITABLE.filter((key) => form[key] !== data.settings[key]).map((key) => [key, form[key]]));
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(changes) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFieldErrors(body.fields ?? {});
        toast({ title: 'Settings not saved', description: body.error ?? 'Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Settings saved', description: 'Changes apply across the platform within 15 seconds.' });
      await reload();
    } finally {
      setIsSaving(false);
    }
  };

  const testSlack = async () => {
    setIsTestingSlack(true);
    try {
      const response = await fetch('/api/admin/settings?action=test-slack', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({}));
      toast({ title: response.ok ? 'Slack test sent' : 'Slack test failed', description: body.message ?? body.error, variant: response.ok ? undefined : 'destructive' });
    } finally {
      setIsTestingSlack(false);
    }
  };

  if (error) return <Card className="border-destructive/40 p-4 text-sm text-destructive">{error}</Card>;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="System Settings" description="Platform-wide configuration. Changes are recorded in Logs." />

      {!form || !data ? <Skeleton className="h-96 w-full" /> : (
        <Tabs defaultValue="general">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger id="admin-settings-tab-general" value="general"><Shield className="mr-2 h-4 w-4" />General</TabsTrigger>
            <TabsTrigger id="admin-settings-tab-notifications" value="notifications"><Bell className="mr-2 h-4 w-4" />Email &amp; notifications</TabsTrigger>
            <TabsTrigger id="admin-settings-tab-integrations" value="integrations"><KeyRound className="mr-2 h-4 w-4" />Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">General</CardTitle><CardDescription>Name, contact address and maintenance mode.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <ToggleSetting
                  id="admin-settings-maintenance"
                  label="Maintenance mode"
                  hint="Blocks the app for everyone except platform administrators: sign-ins and requests are refused until you switch it off."
                  checked={form.maintenanceMode}
                  onChange={(checked) => set('maintenanceMode', checked)}
                >
                  {form.maintenanceMode && (
                    <div className="mt-4 space-y-1.5">
                      <Label htmlFor="admin-settings-maintenance-message">Message shown to users</Label>
                      <Textarea id="admin-settings-maintenance-message" value={form.maintenanceMessage} maxLength={500} onChange={(event) => set('maintenanceMessage', event.target.value)} />
                    </div>
                  )}
                </ToggleSetting>
                {form.maintenanceMode && !data.settings.maintenanceMode && (
                  <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Users will be locked out</AlertTitle><AlertDescription>Once saved, every organization user loses access until maintenance mode is switched off.</AlertDescription></Alert>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextSetting id="admin-settings-app-name" label="Application name" hint="Used in system emails." value={form.appName} error={fieldErrors.appName} onChange={(value) => set('appName', value)} />
                  <TextSetting id="admin-settings-support-email" label="Support email" hint="Shown to users on the maintenance screen." type="email" value={form.supportEmail} error={fieldErrors.supportEmail} onChange={(value) => set('supportEmail', value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Sender</CardTitle><CardDescription>Who system emails come from. The address must be a verified sender in Brevo.</CardDescription></CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <TextSetting id="admin-settings-sender-name" label="Sender name" value={form.senderName} error={fieldErrors.senderName} onChange={(value) => set('senderName', value)} />
                <TextSetting id="admin-settings-sender-email" label="Sender email" type="email" value={form.senderEmail} error={fieldErrors.senderEmail} onChange={(value) => set('senderEmail', value)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Team notifications</CardTitle><CardDescription>Emails to your team (and to Slack, if connected) when something happens.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <TextSetting id="admin-settings-notify-email" label="Send notifications to" type="email" value={form.adminNotificationEmail} error={fieldErrors.adminNotificationEmail} onChange={(value) => set('adminNotificationEmail', value)} />
                <ToggleSetting id="admin-settings-notify-org" label="New organization registers" hint="Organization name and admin contact." checked={form.notifyOnNewOrganization} onChange={(checked) => set('notifyOnNewOrganization', checked)} />
                <ToggleSetting id="admin-settings-notify-contact" label="Contact form submitted" hint="The submission from the public website." checked={form.notifyOnContact} onChange={(checked) => set('notifyOnContact', checked)} />
                <ToggleSetting id="admin-settings-notify-demo" label="Demo requested" hint="The demo request from the public website." checked={form.notifyOnDemoRequest} onChange={(checked) => set('notifyOnDemoRequest', checked)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Slack</CardTitle><CardDescription>Post team notifications to a Slack channel through an incoming webhook.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <TextSetting id="admin-settings-slack-webhook" label="Webhook URL" placeholder="https://hooks.slack.com/services/…" hint="Leave empty to turn Slack off." value={form.slackWebhookUrl} error={fieldErrors.slackWebhookUrl} onChange={(value) => set('slackWebhookUrl', value)} />
                <Button id="admin-settings-slack-test" variant="outline" size="sm" onClick={testSlack} disabled={!data.settings.slackWebhookUrl || isTestingSlack}>
                  {isTestingSlack ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Send test message
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Server keys</CardTitle><CardDescription>Secrets are set as environment variables on the server and are never shown or stored here.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <EnvStatus label="GOOGLE_API_KEY" isSet={data.environment.googleApiKey} purpose="Fallback Google AI key for organizations without their own." />
                <EnvStatus label="BREVO_API_KEY" isSet={data.environment.brevoApiKey} purpose="Sends all system emails." />
                <EnvStatus label="ENCRYPTION_KEY" isSet={data.environment.encryptionKey} purpose="Encrypts stored API keys and Google tokens." />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {form && data && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          <p className="px-1 text-sm text-muted-foreground">
            {isDirty ? 'You have unsaved changes.' : data.settings.updatedAt ? `Last saved ${format(new Date(data.settings.updatedAt), 'd MMM yyyy, HH:mm')}${data.settings.updatedBy ? ` by ${data.settings.updatedBy}` : ''}.` : 'Using default settings.'}
          </p>
          <div className="flex gap-2">
            <Button id="admin-settings-discard" variant="ghost" disabled={!isDirty || isSaving} onClick={() => { setForm(data.settings); setFieldErrors({}); }}>Discard</Button>
            <Button id="admin-settings-save" disabled={!isDirty || isSaving} onClick={save}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
