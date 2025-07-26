
'use client';

import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, MoreHorizontal, Paperclip, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TaskStatus = 'Todo' | 'In Progress' | 'In Review' | 'Done';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  assignees: { name: string; avatarUrl: string }[];
  attachments: number;
  comments: number;
}

const initialTasks: Task[] = [
  { id: 'task-1', title: 'Design the new dashboard layout', status: 'In Review', priority: 'High', assignees: [{ name: 'Alice', avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg' }], attachments: 2, comments: 5 },
  { id: 'task-2', title: 'Develop the authentication API', status: 'In Progress', priority: 'High', assignees: [{ name: 'Bob', avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg' }], attachments: 0, comments: 8 },
  { id: 'task-3', title: 'Write documentation for the API', status: 'Todo', priority: 'Medium', assignees: [{ name: 'Charlie', avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg' }], attachments: 0, comments: 0 },
  { id: 'task-4', title: 'Fix the bug in the reporting module', status: 'In Progress', priority: 'High', assignees: [{ name: 'Diana', avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg' }], attachments: 1, comments: 3 },
  { id: 'task-5', title: 'Set up the staging environment', status: 'Done', priority: 'Medium', assignees: [{ name: 'Eve', avatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg' }], attachments: 0, comments: 1 },
  { id: 'task-6', title: 'Plan the Q4 marketing campaign', status: 'Todo', priority: 'Low', assignees: [], attachments: 5, comments: 2 },
  { id: 'task-7', title: 'Research new analytics tools', status: 'Todo', priority: 'Medium', assignees: [{ name: 'Frank', avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg' }], attachments: 0, comments: 0 },
  { id: 'task-8', title: 'User testing for the new feature', status: 'In Review', priority: 'High', assignees: [{ name: 'Grace', avatarUrl: 'https://randomuser.me/api/portraits/women/4.jpg' }, { name: 'Heidi', avatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg' }], attachments: 3, comments: 11 },
  { id: 'task-9', title: 'Update the company website', status: 'Done', priority: 'Low', assignees: [{ name: 'Ivan', avatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg' }], attachments: 0, comments: 0 },
  { id: 'task-10', title: 'Onboard new marketing intern', status: 'In Progress', priority: 'Medium', assignees: [{ name: 'Alice', avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg' }], attachments: 1, comments: 1 },
  { id: 'task-11', title: 'Prepare Q3 financial report', status: 'Todo', priority: 'High', assignees: [{ name: 'Bob', avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg' }], attachments: 0, comments: 0 },
  { id: 'task-12', title: 'Migrate database to new server', status: 'Todo', priority: 'High', assignees: [{ name: 'Diana', avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg' }, { name: 'Bob', avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg' }], attachments: 0, comments: 0 },
];

const columns: TaskStatus[] = ['Todo', 'In Progress', 'In Review', 'Done'];

const getPriorityBadgeClass = (priority: 'Low' | 'Medium' | 'High') => {
  switch (priority) {
    case 'High': return 'bg-red-500 hover:bg-red-600 text-white';
    case 'Medium': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
    case 'Low': return 'bg-secondary text-secondary-foreground';
  }
};

export default function TaskManagementPage() {
  const [tasks] = useState<Task[]>(initialTasks);

  return (
    <>
      <PageHeader
        title="Task Management Board"
        description="Visualize your team's workflow and track progress on tasks."
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add New Task
        </Button>
      </PageHeader>
      
      <ScrollArea className="w-full h-[calc(100vh-14rem)] pb-4">
          <div className="flex gap-4 h-full">
              {columns.map(status => (
              <div key={status} className="w-80 flex-shrink-0">
                  <Card className="h-full flex flex-col bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                      <CardTitle className="text-base font-semibold">{status} ({tasks.filter(t => t.status === status).length})</CardTitle>
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <ScrollArea className="flex-grow">
                      <CardContent className="p-2 space-y-2">
                      {tasks.filter(task => task.status === status).map(task => (
                          <Card key={task.id} className="bg-card shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                          <CardContent className="p-3 space-y-2">
                              <p className="font-semibold text-sm whitespace-normal">{task.title}</p>
                              {task.description && <p className="text-xs text-muted-foreground whitespace-normal">{task.description}</p>}
                              <Badge variant="outline" className={getPriorityBadgeClass(task.priority)}>{task.priority}</Badge>
                              <div className="flex justify-between items-center pt-2 border-t mt-2">
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  {task.attachments > 0 && <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{task.attachments}</span>}
                                  {task.comments > 0 && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task.comments}</span>}
                              </div>
                              <div className="flex -space-x-2">
                                  {task.assignees.map(assignee => (
                                  <Avatar key={assignee.name} className="h-6 w-6 border-2 border-card">
                                      <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                      <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  ))}
                              </div>
                              </div>
                          </CardContent>
                          </Card>
                      ))}
                      </CardContent>
                  </ScrollArea>
                  </Card>
              </div>
              ))}
          </div>
          <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
}
