
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, MessageSquare, Video, Users as TeamsIcon, Briefcase, Github, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Added import

const communicationPlatforms = [
  { name: 'Email', icon: Mail, logoUrl: 'https://placehold.co/64x64.png', dataAiHint: 'email app logo', description: 'Direct team and client communication.' },
  { name: 'Slack', icon: MessageSquare, logoUrl: 'https://placehold.co/64x64.png', dataAiHint: 'slack app logo', description: 'Instant team messaging and channels.' },
  { name: 'Google Meet', icon: Video, logoUrl: 'https://placehold.co/64x64.png', dataAiHint: 'google meet logo', description: 'Video conferencing and meetings.' },
  { name: 'Zoom', icon: Video, logoUrl: 'https://placehold.co/64x64.png', dataAiHint: 'zoom app logo', description: 'Video calls and webinars.' },
  { name: 'Microsoft Teams', icon: TeamsIcon, logoUrl: 'https://placehold.co/64x64.png', dataAiHint: 'microsoft teams logo', description: 'Collaboration and chat within Microsoft ecosystem.' },
  { name: 'GitHub', icon: Github, logoUrl: 'https://placehold.co/64x64.png', dataAiHint: 'github logo', description: 'Code collaboration and version control discussions.' },
];

const communicationLogs = [
  { id: '1', platform: 'Email', user: 'Alice Mayer', subject: 'Project Alpha Update & Next Steps', timestamp: '2024-07-15 10:00 AM', type: 'Received' },
  { id: '2', platform: 'Slack', user: '#general', subject: 'Bob: Reminder about the team lunch tomorrow!', timestamp: '2024-07-15 10:05 AM', type: 'Channel Message' },
  { id: '3', platform: 'Google Meet', user: 'Charlie Davis', subject: 'Team Sync - Q3 Planning', timestamp: '2024-07-15 11:00 AM', type: 'Meeting Attended' },
  { id: '4', platform: 'GitHub', user: 'repo/project-phoenix', subject: 'Issue #12: Bug in login form reported by Eve', timestamp: '2024-07-15 12:30 PM', type: 'Issue Comment' },
  { id: '5', platform: 'Email', user: 'David Wilson', subject: 'RE: Client Feedback Received', timestamp: '2024-07-15 01:30 PM', type: 'Sent' },
  { id: '6', platform: 'Zoom', user: 'Product Demo', subject: 'Attended client product demonstration', timestamp: '2024-07-14 02:00PM', type: 'Meeting Attended' }
];

const PlatformIcon = ({ platformName }: { platformName: string }) => {
  switch (platformName.toLowerCase()) {
    case 'email': return <Mail className="h-5 w-5 text-primary" />;
    case 'slack': return <MessageSquare className="h-5 w-5 text-purple-500" />; // Specific color for Slack
    case 'google meet': return <Video className="h-5 w-5 text-green-500" />; // Specific color for Meet
    case 'zoom': return <Video className="h-5 w-5 text-blue-600" />; // Specific color for Zoom
    case 'microsoft teams': return <TeamsIcon className="h-5 w-5 text-indigo-500" />; // Specific color for Teams
    case 'github': return <Github className="h-5 w-5 text-foreground" />;
    default: return <Briefcase className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function UnifiedCommunicationsPage() {
  return (
    <>
      <PageHeader
        title="Unified Communications Hub"
        description="Aggregate, search, and analyze communication data from various platforms."
      />

      <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Integrated Platforms</CardTitle>
          <CardDescription>Connect and monitor your communication channels seamlessly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {communicationPlatforms.map((platform) => (
              <Card key={platform.name} className="p-4 flex flex-col items-start hover:shadow-md transition-shadow duration-200 ease-in-out transform hover:-translate-y-1">
                <div className="flex items-center mb-3 w-full">
                  <Image src={platform.logoUrl} alt={`${platform.name} logo`} width={48} height={48} className="rounded-lg" data-ai-hint={platform.dataAiHint} />
                  <CardTitle className="ml-3 text-lg">{platform.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mb-3 flex-grow">{platform.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View Settings
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Recent Communication Logs</CardTitle>
          <CardDescription>Overview of the latest interactions across all integrated platforms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Platform</TableHead>
                  <TableHead>User/Channel</TableHead>
                  <TableHead>Subject/Summary</TableHead>
                  <TableHead className="w-[150px]">Type</TableHead>
                  <TableHead className="text-right w-[180px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communicationLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platformName={log.platform} />
                        {log.platform}
                      </div>
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.subject}</TableCell>
                    <TableCell>
                      <Badge variant={log.type === 'Received' || log.type === 'Meeting Attended' ? 'secondary' : 'outline'}>
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{log.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
