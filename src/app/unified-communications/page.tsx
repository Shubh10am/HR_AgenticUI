import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, MessageCircle, Video, Users as TeamsIcon, Briefcase } from 'lucide-react'; // Using Briefcase for generic 'Others'
import Image from 'next/image';

const communicationPlatforms = [
  { name: 'Email', icon: Mail, logoUrl: 'https://placehold.co/40x40.png', dataAiHint: 'email logo' },
  { name: 'Slack', icon: MessageCircle, logoUrl: 'https://placehold.co/40x40.png', dataAiHint: 'slack logo' },
  { name: 'Google Meet', icon: Video, logoUrl: 'https://placehold.co/40x40.png', dataAiHint: 'google meet logo' },
  { name: 'Zoom', icon: Video, logoUrl: 'https://placehold.co/40x40.png', dataAiHint: 'zoom logo' },
  { name: 'Microsoft Teams', icon: TeamsIcon, logoUrl: 'https://placehold.co/40x40.png', dataAiHint: 'microsoft teams logo' },
  { name: 'Other Platform', icon: Briefcase, logoUrl: 'https://placehold.co/40x40.png', dataAiHint: 'communication platform' },
];

const communicationLogs = [
  { platform: 'Email', user: 'Alice', subject: 'Project Alpha Update', timestamp: '2024-07-15 10:00 AM' },
  { platform: 'Slack', user: 'Bob', subject: '#general discussion', timestamp: '2024-07-15 10:05 AM' },
  { platform: 'Google Meet', user: 'Charlie', subject: 'Team Sync Meeting', timestamp: '2024-07-15 11:00 AM' },
  { platform: 'Email', user: 'David', subject: 'Client Feedback Received', timestamp: '2024-07-15 01:30 PM' },
];

export default function UnifiedCommunicationsPage() {
  return (
    <>
      <PageHeader
        title="Unified Communications"
        description="Aggregate and analyze communication data from various platforms."
      />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Integrated Platforms</CardTitle>
          <CardDescription>Connect and monitor your communication channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {communicationPlatforms.map((platform) => (
              <Card key={platform.name} className="p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <Image src={platform.logoUrl} alt={`${platform.name} logo`} width={40} height={40} className="mb-2 rounded-md" data-ai-hint={platform.dataAiHint} />
                {/* <platform.icon className="h-10 w-10 text-primary mb-2" /> */}
                <p className="text-sm font-medium">{platform.name}</p>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Communication Logs</CardTitle>
          <CardDescription>Overview of the latest interactions across platforms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>User/Channel</TableHead>
                  <TableHead>Subject/Summary</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communicationLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{log.platform}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.subject}</TableCell>
                    <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
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
