
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Mail, Users, FileText, MessageSquare, ListChecks, CalendarDays, GitFork, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  label?: string;
}

interface ProjectTask {
    id: string;
    name: string;
    status: 'Todo' | 'In Progress' | 'Done';
    assignee?: string;
    dueDate?: string;
}

const projectTasks: ProjectTask[] = [
    { id: '1', name: 'Develop onboarding flow', status: 'Done', assignee: 'Alice', dueDate: '2024-07-10' },
    { id: '2', name: 'Design new dashboard widgets', status: 'In Progress', assignee: 'Bob', dueDate: '2024-07-20' },
    { id: '3', name: 'Integrate payment gateway', status: 'In Progress', assignee: 'Charlie', dueDate: '2024-07-25' },
    { id: '4', name: 'User testing for mobile app', status: 'Todo', dueDate: '2024-08-01' },
    { id: '5', name: 'Update documentation', status: 'Todo', dueDate: '2024-08-05' },
];


export default function DashboardPage() {
  const quickActions: QuickAction[] = [
    { title: 'Email Assistance', description: 'AI-powered help for inquiries.', href: '/email-assistance', icon: Mail },
    { title: 'Recruitment Hub', description: 'Streamline hiring with AI tools.', href: '/recruitment', icon: GitFork },
    { title: 'Smart Drafting', description: 'Generate emails from prompts.', href: '/smart-drafting', icon: FileText },
    { title: 'Unified Comms', description: 'Aggregated communication logs.', href: '/unified-communications', icon: MessageSquare },
    { title: 'Attendance', description: 'Clock in/out and view reports.', href: '/attendance-reporting', icon: CalendarDays },
    { title: 'Integrations', description: 'Connect to other services.', href: '/integrations', icon: Users }, // Users icon as placeholder, Plug is in sidebar
  ];
  
  const completedTasks = projectTasks.filter(task => task.status === 'Done').length;
  const totalTasks = projectTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;


  return (
    <>
      <PageHeader
        title="Welcome to HR Streamline AI"
        description="Your intelligent assistant for efficient HR operations."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.href} className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground pt-1">{action.description}</CardDescription>
              </div>
              <action.icon className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" size="sm" className="w-full group mt-2">
                <Link href={action.href}>
                  Go to {action.label || action.title.split(' ')[0]}
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                    <ListChecks className="mr-2 h-6 w-6 text-primary" />
                    Project Nova - Q3 Milestones
                </CardTitle>
                <Badge variant="secondary">In Progress</Badge>
            </div>
            <CardDescription>Overview of current project tasks and progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-semibold text-primary">{completedTasks} / {totalTasks} Tasks</span>
              </div>
              <Progress value={progressPercentage} className="w-full h-3" />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {projectTasks.slice(0,3).map(task => ( // Show first 3 tasks
                    <div key={task.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <div>
                            <p className="text-sm font-medium">{task.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {task.assignee ? `Assignee: ${task.assignee} | ` : ''}
                                {task.dueDate ? `Due: ${task.dueDate}` : ''}
                            </p>
                        </div>
                        <Badge variant={task.status === 'Done' ? 'default' : task.status === 'In Progress' ? 'secondary' : 'outline'}
                               className={task.status === 'Done' ? 'bg-green-500 text-white' : task.status === 'In Progress' ? 'bg-yellow-500 text-black' : ''}
                        >
                            {task.status}
                        </Badge>
                    </div>
                ))}
            </div>
             <Button variant="link" size="sm" className="p-0 h-auto text-primary hover:underline">
                View All Tasks <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-6 w-6 text-primary"/>
                System Status
            </CardTitle>
            <CardDescription>Current status of integrated services.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span>Email Integration</span>
                <Badge variant="default" className="bg-green-500 text-white">Operational</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Slack Integration</span>
                <Badge variant="default" className="bg-green-500 text-white">Operational</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>AI Services</span>
                <Badge variant="default" className="bg-green-500 text-white">Operational</Badge>
              </li>
               <li className="flex items-center justify-between">
                <span>Database Connectivity</span>
                <Badge variant="destructive">Degraded</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    