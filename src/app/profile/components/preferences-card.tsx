'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { CalendarDays, Clock, Globe, Home, Loader2, Palette, Settings2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Preferences } from '@/lib/preferences';
import { formatDateTime } from '../format';

interface Props {
  token: string;
  preferences: Preferences | null;
  startPages: { path: string; label: string }[];
  onChange: (preferences: Preferences) => void;
}

const BROWSER_ZONE = 'browser';

function zoneList(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  return supported ? supported('timeZone') : ['UTC', 'Europe/London', 'America/New_York', 'Asia/Kolkata', 'Asia/Singapore'];
}

function Row({ icon: Icon, label, hint, htmlFor, children }: { icon: typeof Globe; label: string; hint: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Label htmlFor={htmlFor} className="flex flex-col gap-1">
        <span className="flex items-center"><Icon className="mr-2 h-4 w-4" />{label}</span>
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      </Label>
      <div className="sm:w-56">{children}</div>
    </div>
  );
}

export default function PreferencesCard({ token, preferences, startPages, onChange }: Props) {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [saving, setSaving] = useState<keyof Preferences | null>(null);
  const zones = useMemo(zoneList, []);
  const [now] = useState(() => new Date().toISOString());

  // Keep the visible theme in step with the saved preference.
  useEffect(() => {
    if (preferences) setTheme(preferences.theme);
  }, [preferences?.theme, setTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    if (!preferences) return;
    const previous = preferences;
    onChange({ ...preferences, [key]: value });
    setSaving(key);
    try {
      const response = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save.');
      onChange(data.preferences);
      toast({ title: 'Preference saved' });
    } catch (error) {
      onChange(previous);
      toast({ title: 'Could not save preference', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  }

  const spinner = (key: keyof Preferences) => saving === key && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings2 className="mr-2 h-5 w-5 text-primary" /> Preferences
        </CardTitle>
        <CardDescription>Saved to your account, so they follow you to any device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preferences ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <Row icon={Palette} label="Theme" hint="Light, dark, or follow your system." htmlFor="pref-theme">
              <Select value={preferences.theme} onValueChange={(value) => save('theme', value as Preferences['theme'])} disabled={!!saving}>
                <SelectTrigger id="pref-theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Separator />
            <Row icon={Home} label="Start page" hint="Where you land after signing in." htmlFor="pref-start-page">
              <Select value={preferences.startPage} onValueChange={(value) => save('startPage', value)} disabled={!!saving}>
                <SelectTrigger id="pref-start-page"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {startPages.map((page) => <SelectItem key={page.path} value={page.path}>{page.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Row>
            <Separator />
            <Row icon={Globe} label="Time zone" hint="Used for times on your profile and activity." htmlFor="pref-time-zone">
              <Select value={preferences.timeZone || BROWSER_ZONE} onValueChange={(value) => save('timeZone', value === BROWSER_ZONE ? '' : value)} disabled={!!saving}>
                <SelectTrigger id="pref-time-zone"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={BROWSER_ZONE}>Use this device&apos;s time zone</SelectItem>
                  {zones.map((zone) => <SelectItem key={zone} value={zone}>{zone.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </Row>
            <Separator />
            <Row icon={CalendarDays} label="Date format" hint={`Example: ${formatDateTime(now, preferences, false)}`} htmlFor="pref-date-format">
              <Select value={preferences.dateFormat} onValueChange={(value) => save('dateFormat', value as Preferences['dateFormat'])} disabled={!!saving}>
                <SelectTrigger id="pref-date-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="locale">Browser default</SelectItem>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pref-24h" className="flex flex-col gap-1">
                <span className="flex items-center"><Clock className="mr-2 h-4 w-4" />24-hour clock{spinner('use24HourClock')}</span>
                <span className="text-xs font-normal text-muted-foreground">Show 14:30 instead of 2:30 PM.</span>
              </Label>
              <Switch id="pref-24h" checked={preferences.use24HourClock} onCheckedChange={(checked) => save('use24HourClock', checked)} disabled={!!saving} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pref-new-device" className="flex flex-col gap-1">
                <span className="flex items-center"><ShieldAlert className="mr-2 h-4 w-4" />New device alerts{spinner('newDeviceAlerts')}</span>
                <span className="text-xs font-normal text-muted-foreground">Flag sign-ins from a browser or IP you haven&apos;t used before.</span>
              </Label>
              <Switch id="pref-new-device" checked={preferences.newDeviceAlerts} onCheckedChange={(checked) => save('newDeviceAlerts', checked)} disabled={!!saving} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
