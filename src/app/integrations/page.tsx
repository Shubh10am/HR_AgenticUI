
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Link as LinkIcon, CheckCircle, Settings, MessageSquare, CalendarDays, Webcam, Users, LayoutGrid, FileSignature, KanbanSquare, Video, Inbox, Loader2, Send, FileText, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';

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
  isDisconnecting?: boolean; // New state for disconnect
}

const initialIntegrations: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect your Gmail account to fetch, read, and reply to emails with AI assistance.',
    icon: Inbox,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
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
    logoUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
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
    logoUrl: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/250px-Google_Calendar_icon_%282020%29.svg.png',
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
    logoUrl: 'https://st2.zoom.us/static/6.3.38697/image/new/topNav/Zoom_logo.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg',
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
    logoUrl: 'https://www.microsoft.com/favicon.ico',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Docusign_Full_Color.svg/500px-Docusign_Full_Color.svg.png',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Trello_logo.svg/800px-Trello_logo.svg.png',
    dataAiHint: 'trello logo',
    category: 'Project Management',
    isConnected: true,
    features: ['Board Sync', 'Task Automation', 'Recruitment Tracking'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Track issues, manage projects, and automate workflows for HR and development teams.',
    icon: KanbanSquare,
    logoUrl: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/atlassian_jira_logo_icon_170511.png',
    dataAiHint: 'jira logo',
    category: 'Project Management',
    isConnected: false,
    features: ['Issue Tracking', 'Project Automation', 'Custom Workflows'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect your workspace to sync notes, docs, and project plans with your HR workflows.',
    icon: FileText,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    dataAiHint: 'notion logo',
    category: 'Productivity',
    isConnected: false,
    features: ['Sync Pages', 'Database Integration', 'Knowledge Base Sync'],
    requiresOAuth: true,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Automate meeting scheduling to save time and reduce back-and-forth emails.',
    icon: CalendarDays,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7f/Calendly_company_logo.png/500px-Calendly_company_logo.png',
    dataAiHint: 'calendly logo',
    category: 'Productivity',
    isConnected: false,
    features: ['Embed Scheduling Page', 'Automated Reminders', 'Calendar Sync'],
    requiresOAuth: true,
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    description: 'Sync your Outlook calendar for scheduling and availability tracking across the Microsoft ecosystem.',
    icon: CalendarDays,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/512px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png',
    dataAiHint: 'outlook logo',
    category: 'Email',
    isConnected: false,
    features: ['Schedule Meetings', 'Availability Sync', 'Contact Sync'],
    requiresOAuth: true,
  },
];


export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const { toast } = useToast();
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('connect') === 'success') {
      toast({
        title: 'Google Account Connected',
        description: 'Successfully authenticated with Google. You can now use related integrations.',
      });
      // A mechanism to update the isConnected status would go here,
      // possibly by refetching integration statuses from the backend.
      // For now, we'll optimistically update the UI for Google integrations.
      setIntegrations(prev =>
        prev.map(int => 
          int.id === 'gmail' || int.id === 'google-calendar' || int.id === 'google-meet' || int.id === 'google-workspace'
          ? { ...int, isConnected: true }
          : int
        )
      );
      // Clean the URL
      router.replace('/integrations');
    }
  }, [searchParams, toast, router]);


  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestedIntegrationName, setRequestedIntegrationName] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleConnect = async (id: string) => {
    const integrationToUpdate = integrations.find(int => int.id === id);
    if (!integrationToUpdate || !token) return;

    if (integrationToUpdate.requiresOAuth) {
        setIntegrations(prev =>
            prev.map(int => (int.id === id ? { ...int, oauthConnecting: true } : int))
        );
        try {
            // The redirection will happen on the server side after this call
            window.location.href = `/api/google-auth/connect`;
        } catch (error) {
            console.error("Failed to initiate connection:", error);
            toast({ title: 'Connection Failed', description: 'Could not start the authentication process.', variant: 'destructive' });
            setIntegrations(prev =>
                prev.map(int => (int.id === id ? { ...int, oauthConnecting: false } : int))
            );
        }
    } else {
        // Handle simple toggle for non-OAuth integrations
        setIntegrations(prev =>
            prev.map(int => (int.id === id ? { ...int, isConnected: !int.isConnected } : int))
        );
        toast({
            title: `${integrationToUpdate.name} ${!integrationToUpdate.isConnected ? 'Connected' : 'Disconnected'}`,
            description: `Successfully ${!integrationToUpdate.isConnected ? 'connected to' : 'disconnected from'} ${integrationToUpdate.name}.`,
            variant: !integrationToUpdate.isConnected ? "default" : "destructive",
        });
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!token) return;
    setIntegrations(prev => prev.map(int => int.id === id ? { ...int, isDisconnecting: true } : int));
    try {
        const response = await fetch('/api/google-auth/disconnect', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to disconnect.');
        
        toast({ title: 'Account Disconnected', description: 'Your Google account credentials have been removed.' });
        // Update all Google integrations to disconnected
        setIntegrations(prev => prev.map(int => 
            (int.id === 'gmail' || int.id === 'google-calendar' || int.id === 'google-meet' || int.id === 'google-workspace') 
            ? { ...int, isConnected: false } : int
        ));
    } catch (error: any) {
        toast({ title: 'Disconnect Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIntegrations(prev => prev.map(int => int.id === id ? { ...int, isDisconnecting: false } : int));
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map(integration => (
          <Card 
            key={integration.id} 
            className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col"
          >
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
                <div className="flex min-w-0 items-center space-x-2 overflow-hidden">
                  <Label
                    className={`inline-block truncate ${integration.isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {integration.oauthConnecting ? 'Connecting...' : (integration.isDisconnecting ? 'Disconnecting...' : (integration.isConnected ? 'Connected' : 'Disconnected'))}
                  </Label>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  {integration.isConnected ? (
                    <>
                      {integration.requiresOAuth ? (
                        <Button variant="destructive" size="sm" onClick={() => handleDisconnect(integration.id)} disabled={integration.isDisconnecting}>
                          {integration.isDisconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                          Disconnect
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" /> Configure
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button size="sm" onClick={() => handleConnect(integration.id)} disabled={integration.oauthConnecting}>
                      {integration.oauthConnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LinkIcon className="mr-2 h-4 w-4" />
                      )}
                       {integration.oauthConnecting ? 'Please wait' : 'Connect'}
                    </Button>
                  )}
                </div>
              </div>
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
