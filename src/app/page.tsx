import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Mail, Users, FileText, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const quickActions = [
    { title: 'Draft Email Response', description: 'AI-powered assistance for employee inquiries.', href: '/email-assistance', icon: Mail },
    { title: 'Manage Recruitment', description: 'Streamline your hiring process with AI.', href: '/recruitment', icon: Users },
    { title: 'Quick Email Draft', description: 'Generate professional emails from prompts.', href: '/smart-drafting', icon: FileText },
    { title: 'View Communications', description: 'Aggregated communication logs.', href: '/unified-communications', icon: MessageSquare },
  ];

  return (
    <>
      <PageHeader
        title="Welcome to HR Streamline AI"
        description="Your intelligent assistant for efficient HR operations."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Card key={action.href} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
              <action.icon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-4">{action.description}</CardDescription>
              <Button asChild variant="outline" size="sm" className="w-full group">
                <Link href={action.href}>
                  Go to {action.label || action.title.split(' ')[0]}
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent actions and alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span> New candidate 'Jane Doe' applied for Software Engineer.</li>
              <li className="flex items-center"><span className="mr-2 h-2 w-2 rounded-full bg-blue-500"></span> Monthly attendance report for 'John Smith' generated.</li>
              <li className="flex items-center"><span className="mr-2 h-2 w-2 rounded-full bg-yellow-500"></span> 3 email drafts awaiting review.</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current status of integrated services.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>Email Integration</span> <span className="text-green-500 font-medium">Operational</span></li>
              <li className="flex items-center justify-between"><span>Slack Integration</span> <span className="text-green-500 font-medium">Operational</span></li>
              <li className="flex items-center justify-between"><span>AI Services</span> <span className="text-green-500 font-medium">Operational</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
