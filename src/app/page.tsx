
'use client';

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Mail, Users, FileText, MessageSquare, ListChecks, CalendarDays, GitFork, BarChart3, PlusCircle, Trash2, CheckCircle, RefreshCw, Circle, Plug } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Added import for Label
import { useToast } from '@/hooks/use-toast';

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

const initialProjectTasks: ProjectTask[] = [
    { id: '1', name: 'Develop onboarding flow', status: 'Done', assignee: 'Alice', dueDate: '2024-07-10' },
    { id: '2', name: 'Design new dashboard widgets', status: 'In Progress', assignee: 'Bob', dueDate: '2024-07-20' },
    { id: '3', name: 'Integrate payment gateway', status: 'In Progress', assignee: 'Charlie', dueDate: '2024-07-25' },
    { id: '4', name: 'User testing for mobile app', status: 'Todo', dueDate: '2024-08-01' },
    { id: '5', name: 'Update documentation', status: 'Todo' }, // Removed due date for variety
];


export default function DashboardPage() {
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>(initialProjectTasks);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const { toast } = useToast();

  const quickActions: QuickAction[] = [
    { title: 'Email Assistance', description: 'AI-powered help for inquiries.', href: '/email-assistance', icon: Mail },
    { title: 'Recruitment Hub', description: 'Streamline hiring with AI tools.', href: '/recruitment', icon: GitFork },
    { title: 'Smart Drafting', description: 'Generate emails from prompts.', href: '/smart-drafting', icon: FileText },
    { title: 'Unified Comms', description: 'Aggregated communication logs.', href: '/unified-communications', icon: MessageSquare },
    { title: 'Attendance', description: 'Clock in/out and view reports.', href: '/attendance-reporting', icon: CalendarDays },
    { title: 'Integrations', description: 'Connect to other services.', href: '/integrations', icon: Plug },
  ];
  
  const completedTasks = projectTasks.filter(task => task.status === 'Done').length;
  const totalTasks = projectTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTaskName.trim()) {
      toast({ title: "Task name required", description: "Please enter a name for the task.", variant: "destructive" });
      return;
    }
    const newTask: ProjectTask = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      status: 'Todo',
      assignee: newTaskAssignee.trim() || undefined,
      dueDate: newTaskDueDate.trim() || undefined,
    };
    setProjectTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskName('');
    setNewTaskAssignee('');
    setNewTaskDueDate('');
    toast({ title: "Task Added", description: `"${newTask.name}" has been added.` });
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setProjectTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          let nextStatus: ProjectTask['status'] = 'Todo';
          if (task.status === 'Todo') nextStatus = 'In Progress';
          else if (task.status === 'In Progress') nextStatus = 'Done';
          else if (task.status === 'Done') nextStatus = 'Todo'; // Cycle back
          return { ...task, status: nextStatus };
        }
        return task;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = projectTasks.find(task => task.id === taskId);
    setProjectTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.name}" has been removed.`, variant: "destructive" });
    }
  };

  const getStatusIcon = (status: ProjectTask['status']) => {
    if (status === 'Done') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'In Progress') return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin-slow" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };
  
  const getStatusBadgeVariant = (status: ProjectTask['status']): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    if (status === 'Done') return 'default';
    if (status === 'In Progress') return 'secondary';
    return 'outline';
  };
  
  const getStatusBadgeClassName = (status: ProjectTask['status']): string => {
     if (status === 'Done') return 'bg-green-500 hover:bg-green-600 text-white';
     if (status === 'In Progress') return 'bg-yellow-500 hover:bg-yellow-600 text-black';
     return 'border-gray-400 text-gray-600 dark:border-gray-500 dark:text-gray-300';
  }

  const pageTitle: ReactNode = (
    <>
      Welcome to{' '}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]">
        HR Streamline AI
      </span>
    </>
  );

  return (
    <>
      <PageHeader
        title={pageTitle}
        titleClassName="text-5xl lg:text-6xl"
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
        <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                    <ListChecks className="mr-2 h-6 w-6 text-primary" />
                    Project Nova - Q3 Milestones
                </CardTitle>
                <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'} className={progressPercentage === 100 ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}>
                  {progressPercentage === 100 ? 'Completed' : 'In Progress'}
                </Badge>
            </div>
            <CardDescription>Track your project tasks and overall progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-semibold text-primary">{completedTasks} / {totalTasks} Tasks ({progressPercentage}%)</span>
              </div>
              <Progress value={progressPercentage} className="w-full h-3" />
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-3 pt-4 border-t">
              <div>
                <Label htmlFor="newTaskName" className="text-xs font-medium">Task Name</Label>
                <Input 
                  id="newTaskName" 
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name..."
                  className="mt-1 h-9" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="newTaskAssignee" className="text-xs font-medium">Assignee (Optional)</Label>
                  <Input 
                    id="newTaskAssignee" 
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    placeholder="e.g., Alice"
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="newTaskDueDate" className="text-xs font-medium">Due Date (Optional)</Label>
                  <Input 
                    id="newTaskDueDate" 
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    placeholder="e.g., 2024-08-15"
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </form>

            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2">
                {projectTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add one above!</p>
                )}
                {projectTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-secondary/50 transition-colors duration-150 ease-in-out">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleToggleTaskStatus(task.id)} title={`Toggle status for ${task.name}`}>
                                {getStatusIcon(task.status)}
                            </Button>
                            <div>
                                <p className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>{task.name}</p>
                                {(task.assignee || task.dueDate) && (
                                  <p className="text-xs text-muted-foreground">
                                      {task.assignee && `Assignee: ${task.assignee}`}
                                      {task.assignee && task.dueDate && " | "}
                                      {task.dueDate && `Due: ${task.dueDate}`}
                                  </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(task.status)}
                                 className={`${getStatusBadgeClassName(task.status)} cursor-pointer`}
                                 onClick={() => handleToggleTaskStatus(task.id)}
                                 title={`Current status: ${task.status}. Click to change.`}
                          >
                              {task.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteTask(task.id)} title={`Delete task "${task.name}"`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
          {totalTasks > 5 && (
            <CardFooter>
                 <p className="text-xs text-muted-foreground">Scroll to see more tasks.</p>
            </CardFooter>
           )}
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
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .bg-gradient-to-r.from-\\[hsl\\(var\\(--primary\\))\\].to-\\[hsl\\(var\\(--accent\\))\\] {
          background-image: linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)));
        }
      `}</style>
    </>
  );
}
