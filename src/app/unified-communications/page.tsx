
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, MessageSquare, Video, Users as TeamsIcon, Briefcase, Github } from 'lucide-react';
// Removed Image import as we are using simple img for placeholders
import { Badge } from '@/components/ui/badge';

const communicationPlatforms = [
  { name: 'Email', icon: Mail, logoUrl: 'https://placehold.co/56x56.png', dataAiHint: 'email app logo', description: 'Direct team and client communication.' },
  { name: 'Slack', icon: MessageSquare, logoUrl: 'https://placehold.co/56x56.png', dataAiHint: 'slack app logo', description: 'Instant team messaging and channels.' },
  { name: 'Google Meet', icon: Video, logoUrl: 'https://placehold.co/56x56.png', dataAiHint: 'google meet logo', description: 'Video conferencing and meetings.' },
  { name: 'Zoom', icon: Video, logoUrl: 'https://placehold.co/56x56.png', dataAiHint: 'zoom app logo', description: 'Video calls and webinars.' },
  { name: 'Microsoft Teams', icon: TeamsIcon, logoUrl: 'https://placehold.co/56x56.png', dataAiHint: 'microsoft teams logo', description: 'Collaboration and chat within Microsoft ecosystem.' },
  { name: 'GitHub', icon: Github, logoUrl: 'https://placehold.co/56x56.png', dataAiHint: 'github logo', description: 'Code collaboration and version control discussions.' },
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
    case 'slack': return <MessageSquare className="h-5 w-5 text-purple-500" />;
    case 'google meet': return <Video className="h-5 w-5 text-green-500" />;
    case 'zoom': return <Video className="h-5 w-5 text-blue-600" />;
    case 'microsoft teams': return <TeamsIcon className="h-5 w-5 text-indigo-500" />;
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
          <CardTitle>Integrated Platforms Overview</CardTitle>
          <CardDescription>Your connected tools at a glance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-4">
          {/* Speech bubble */}
          <div className="relative mb-4">
            <div className="bg-foreground text-background p-3 rounded-lg shadow-md">
              <p className="text-sm font-medium text-center">You are using {communicationPlatforms.length} tools to streamline your work!</p>
            </div>
            {/* Triangle for speech bubble */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0
              border-l-[10px] border-l-transparent
              border-t-[10px] border-t-foreground
              border-r-[10px] border-r-transparent">
            </div>
          </div>

          {/* Icon bar */}
          <div className="flex justify-center items-center space-x-2 p-4 bg-secondary rounded-xl shadow-lg mt-6 w-auto max-w-md">
            {communicationPlatforms.map((platform) => (
              <div key={platform.name} className="group relative" title={platform.name}>
                <img 
                  src={platform.logoUrl} 
                  alt={`${platform.name} logo`} 
                  width={56} 
                  height={56} 
                  className="rounded-lg transition-transform duration-200 ease-in-out group-hover:scale-110 cursor-pointer object-contain" 
                  data-ai-hint={platform.dataAiHint} 
                />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-foreground text-background text-xs px-2 py-1 rounded-md shadow-lg transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {platform.name}
                </span>
              </div>
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

