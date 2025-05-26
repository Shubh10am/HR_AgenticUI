
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Link, CheckCircle, Settings, ExternalLink, MessageSquare, CalendarDays, Webcam, Users, LayoutGrid, FileSignature, KanbanSquare, Video, Inbox, Loader2, Send } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  logoUrl?: string;
  dataAiHint?: string;
  category: string;
  isConnected: boolean;
  features: string[];
  requiresOAuth?: boolean;
  oauthConnecting?: boolean;
}

const initialIntegrations: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect your Gmail account to fetch, read, and reply to emails with AI assistance.',
    icon: Inbox,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'gmail logo',
    category: 'Email',
    isConnected: false,
    features: ['Fetch Emails', 'AI Reply Generation', 'Send Emails (Mock)'],
    requiresOAuth: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub account to sync repositories, track issues, and analyze developer activity.',
    icon: Github,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'github logo',
    category: 'Development',
    isConnected: false,
    features: ['Repository Sync', 'Issue Tracking', 'Activity Summary'],
    requiresOAuth: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Integrate Slack for notifications, quick actions, and communication logging.',
    icon: MessageSquare,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'slack app logo',
    category: 'Communication',
    isConnected: true,
    features: ['Notifications', 'Slash Commands', 'Message Logging'],
  },
   {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync calendars for scheduling interviews, meetings, and managing team availability.',
    icon: CalendarDays,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'google calendar logo',
    category: 'Productivity',
    isConnected: false,
    features: ['Meeting Scheduling', 'Availability Sync', 'Leave Management'],
    requiresOAuth: true,
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Connect Zoom for seamless video conferencing, meeting recordings, and webinar management.',
    icon: Webcam,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'zoom app logo',
    category: 'Communication',
    isConnected: false,
    features: ['Schedule Meetings', 'Cloud Recordings', 'User Management'],
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    description: 'Integrate Google Meet for easy video calls and team meetings directly from your HR platform.',
    icon: Video,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'google meet logo',
    category: 'Communication',
    isConnected: false,
    features: ['Start Meetings', 'Schedule Calls', 'Sync Recordings'],
    requiresOAuth: true,
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams for chat, channels, and file sharing within your HR workflows.',
    icon: Users,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'microsoft teams logo',
    category: 'Communication',
    isConnected: true,
    features: ['Team Notifications', 'File Sync', 'Automated Approvals'],
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Sync with Google Drive, Docs, and Sheets for collaborative document management.',
    icon: LayoutGrid,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'google workspace logo',
    category: 'Productivity',
    isConnected: false,
    features: ['Drive Integration', 'Docs Collaboration', 'Sheet Automation'],
    requiresOAuth: true,
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Streamline offer letters and HR documents with eSignature capabilities from DocuSign.',
    icon: FileSignature,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'docusign logo',
    category: 'Documents',
    isConnected: false,
    features: ['Send Envelopes', 'Track Signatures', 'Secure Document Storage'],
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Manage HR projects, onboarding checklists, and recruitment pipelines using Trello boards.',
    icon: KanbanSquare,
    logoUrl: 'https://placehold.co/64x64.png',
    dataAiHint: 'trello logo',
    category: 'Project Management',
    isConnected: true,
    features: ['Board Sync', 'Task Automation', 'Recruitment Tracking'],
  },
];


export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const { toast } = useToast();

  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestedIntegrationName, setRequestedIntegrationName] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [contactEmail, setContactEmail] = useState('');


  const toggleConnection = (id: string) => {
    const integrationToUpdate = integrations.find(int => int.id === id);
    if (!integrationToUpdate) return;

    if (!integrationToUpdate.isConnected && integrationToUpdate.requiresOAuth) {
      // Simulate OAuth connection
      setIntegrations(prev =>
        prev.map(int =>
          int.id === id ? { ...int, oauthConnecting: true } : int
        )
      );
      toast({
        title: `Connecting to ${integrationToUpdate.name}...`,
        description: 'Simulating OAuth authentication flow.',
      });
      setTimeout(() => {
        setIntegrations(prev =>
          prev.map(int =>
            int.id === id ? { ...int, isConnected: true, oauthConnecting: false } : int
          )
        );
        toast({
            title: `${integrationToUpdate.name} Connected`,
            description: `Successfully connected to ${integrationToUpdate.name} (mock).`,
            variant: "default",
        });
      }, 1500);
    } else {
      // Regular toggle for non-OAuth or disconnection
      setIntegrations(prev =>
        prev.map(int =>
          int.id === id ? { ...int, isConnected: !int.isConnected } : int
        )
      );
      toast({
          title: `${integrationToUpdate.name} ${!integrationToUpdate.isConnected ? 'Connected' : 'Disconnected'}`,
          description: `Successfully ${!integrationToUpdate.isConnected ? 'connected to' : 'disconnected from'} ${integrationToUpdate.name}.`,
          variant: !integrationToUpdate.isConnected ? "default" : "destructive",
      });
    }
  };

  const handleIntegrationRequestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestedIntegrationName.trim() || !requestReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide the name of the integration and a reason for your request.",
        variant: "destructive",
      });
      return;
    }
    // Mock submission
    console.log("Integration Request:", { requestedIntegrationName, requestReason, contactEmail });
    toast({
      title: "Request Submitted (Mock)",
      description: `Your request for "${requestedIntegrationName}" has been received. Thank you!`,
    });
    setRequestedIntegrationName('');
    setRequestReason('');
    setContactEmail('');
    setIsRequestDialogOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Manage Integrations"
        description="Connect and configure third-party services to enhance your HR workflow."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {integrations.map(integration => (
          <Card key={integration.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center">
                    {integration.logoUrl ? (
                       <Image src={integration.logoUrl} alt={`${integration.name} logo`} width={40} height={40} className="rounded-md object-contain" data-ai-hint={integration.dataAiHint}/>
                    ) : (
                      <integration.icon className="h-10 w-10 text-primary" />
                    )}
                    <CardTitle className="ml-3 text-xl">{integration.name}</CardTitle>
                 </div>
                 <Badge variant="outline">{integration.category}</Badge>
              </div>
              <CardDescription className="text-sm min-h-[40px]">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground">FEATURES:</h4>
              <ul className="space-y-1 text-xs">
                {integration.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardContent className="border-t pt-4 mt-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center space-x-2">
                  <Switch
                    id={`switch-${integration.id}`}
                    checked={integration.isConnected}
                    onCheckedChange={() => toggleConnection(integration.id)}
                    aria-label={`Connect to ${integration.name}`}
                    className="flex-shrink-0"
                    disabled={integration.oauthConnecting}
                  />
                  <Label
                    htmlFor={`switch-${integration.id}`}
                    className={`truncate ${integration.isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {integration.oauthConnecting ? 'Connecting...' : (integration.isConnected ? 'Connected' : 'Disconnected')}
                  </Label>
                </div>
                <div className="flex-shrink-0">
                  {integration.isConnected ? (
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" /> Configure
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => toggleConnection(integration.id)} disabled={integration.oauthConnecting}>
                      {integration.oauthConnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Link className="mr-2 h-4 w-4" />
                      )}
                       {integration.oauthConnecting ? 'Please wait' : 'Connect'}
                    </Button>
                  )}
                </div>
              </div>
              {integration.requiresOAuth && !integration.isConnected && !integration.oauthConnecting && (
                <p className="text-xs text-muted-foreground mt-3">
                  Connecting {integration.name} requires OAuth authentication.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>Request New Integration</CardTitle>
          <CardDescription>Can't find an integration you need? Let us know!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We are always looking to expand our supported integrations. If there's a service you'd like to see here, please submit a request.
          </p>
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Request Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Request a New Integration</DialogTitle>
                <DialogDescription>
                  Tell us which integration you'd like to see. We'll review your request.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleIntegrationRequestSubmit} id="integrationRequestForm" className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="requestedIntegrationName">Integration Name</Label>
                  <Input
                    id="requestedIntegrationName"
                    value={requestedIntegrationName}
                    onChange={(e) => setRequestedIntegrationName(e.target.value)}
                    placeholder="e.g., Awesome Service XYZ"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="requestReason">Reason for Request / Use Case</Label>
                  <Textarea
                    id="requestReason"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Describe how this integration would help you or your team."
                    className="mt-1 min-h-[100px]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Your Contact Email (Optional)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="So we can follow up if needed"
                    className="mt-1"
                  />
                </div>
              </form>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="integrationRequestForm">
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
}
