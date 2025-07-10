
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, CreditCard, Bell, Shield, Info } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="System Settings"
        description="Configure global application settings and integrations."
      />
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="general"><Shield className="mr-2 h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="api"><KeyRound className="mr-2 h-4 w-4" />API & Integrations</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="mr-2 h-4 w-4" />Billing</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage main application settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="maintenance-mode" className="font-semibold">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable access to the app for non-admin users.
                  </p>
                </div>
                <Switch id="maintenance-mode" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" defaultValue="HR Streamline AI" />
              </div>
              <Button>Save General Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>API & Integrations</CardTitle>
              <CardDescription>Manage global API keys and integration settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Alert variant="default" className="border-blue-500">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700 dark:text-blue-300">Fallback API Key</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-200">
                  This key is used when an organization hasn't provided their own. It's configured in the environment variables.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="global-google-key">Global Google AI API Key (Fallback)</Label>
                <Input id="global-google-key" type="password" placeholder="••••••••••••••••••••••••••••" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                <Input id="slack-webhook" placeholder="https://hooks.slack.com/services/..." />
              </div>
              <Button>Save API Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Billing & Subscriptions</CardTitle>
              <CardDescription>Manage subscription plans and billing integration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-pk">Stripe Publishable Key</Label>
                <Input id="stripe-pk" placeholder="pk_live_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-sk">Stripe Secret Key</Label>
                <Input id="stripe-sk" type="password" placeholder="sk_live_..." />
              </div>
              <Button>Save Billing Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>Configure system-wide email and notification settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from-email">"From" Email Address</Label>
                <Input id="from-email" type="email" placeholder="noreply@hrstreamline.ai" />
              </div>
               <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="new-user-admin-email" className="font-semibold">Notify on New User</Label>
                  <p className="text-sm text-muted-foreground">
                    Send an email to admins when a new organization registers.
                  </p>
                </div>
                <Switch id="new-user-admin-email" defaultChecked />
              </div>
              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
