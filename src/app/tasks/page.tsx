
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as DialogModalFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Github, PlusCircle, Trash2, ChevronLeft, ChevronRight, Circle, RefreshCw, CheckCircle, CalendarDays, User, Edit3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskStatus = 'Todo' | 'In Progress' | 'Done';

interface Task {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  assigneeAvatar?: string; // URL for avatar
  dueDate?: string;
  status: TaskStatus;
  tags?: string[];
}

const initialTasks: Task[] = [
  { id: 'task-1', name: 'Design new onboarding flow visuals', description: 'Create mockups for all steps of the new user onboarding.', assignee: 'Alice Wonderland', assigneeAvatar: 'https://placehold.co/40x40.png', dataAiHint:'woman face', dueDate: '2024-08-15', status: 'Todo', tags: ['UX', 'Design'] },
  { id: 'task-2', name: 'Develop API for user authentication', description: 'Implement OAuth2 and basic credential login.', assignee: 'Bob The Builder', assigneeAvatar: 'https://placehold.co/40x40.png', dataAiHint:'man face', dueDate: '2024-08-20', status: 'In Progress', tags: ['Backend', 'API'] },
  { id: 'task-3', name: 'Write documentation for the new reporting module', description: 'Cover all features and provide examples.', assignee: 'Charlie Brown', assigneeAvatar: 'https://placehold.co/40x40.png', dataAiHint:'person cartoon', dueDate: '2024-08-25', status: 'In Progress', tags: ['Docs'] },
  { id: 'task-4', name: 'User testing session for mobile app', description: 'Conduct tests with 5 users and gather feedback.', status: 'Todo', tags: ['Testing', 'Mobile'] },
  { id: 'task-5', name: 'Deploy staging environment updates', description: 'Merge develop branch to staging and run deployment scripts.', assignee: 'Diana Prince', assigneeAvatar: 'https://placehold.co/40x40.png', dataAiHint:'woman superhero', status: 'Done', tags: ['DevOps', 'Release'] },
];

const statusColumns: TaskStatus[] = ['Todo', 'In Progress', 'Done'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Reusing state for both add and edit forms
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Todo');
  const [taskTags, setTaskTags] = useState(''); // Comma-separated string

  const { toast } = useToast();

  const getStatusIcon = (status: TaskStatus) => {
    if (status === 'Done') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'In Progress') return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin-slow" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const resetFormFields = () => {
    setTaskName('');
    setTaskDescription('');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskStatus('Todo');
    setTaskTags('');
  };

  const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskName.trim()) {
      toast({ title: "Task name required", description: "Please enter a name for the task.", variant: "destructive" });
      return;
    }
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: taskName.trim(),
      description: taskDescription.trim() || undefined,
      assignee: taskAssignee.trim() || undefined,
      assigneeAvatar: taskAssignee.trim() ? `https://placehold.co/40x40.png?text=${taskAssignee.trim().substring(0,2).toUpperCase()}` : undefined,
      dueDate: taskDueDate.trim() || undefined,
      status: taskStatus,
      tags: taskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast({ title: "Task Added", description: `"${newTask.name}" has been added to ${newTask.status}.` });
    
    resetFormFields();
    setIsAddDialogOpen(false);
  };

  const handleOpenEditDialog = (task: Task) => {
    setEditingTask(task);
    setTaskName(task.name);
    setTaskDescription(task.description || '');
    setTaskAssignee(task.assignee || '');
    setTaskDueDate(task.dueDate || '');
    setTaskStatus(task.status);
    setTaskTags(task.tags?.join(', ') || '');
    setIsEditDialogOpen(true);
  };

  const handleEditTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTask || !taskName.trim()) {
      toast({ title: "Task name required", description: "Please enter a name for the task.", variant: "destructive" });
      return;
    }
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              name: taskName.trim(),
              description: taskDescription.trim() || undefined,
              assignee: taskAssignee.trim() || undefined,
              assigneeAvatar: taskAssignee.trim() ? `https://placehold.co/40x40.png?text=${taskAssignee.trim().substring(0,2).toUpperCase()}` : undefined,
              dueDate: taskDueDate.trim() || undefined,
              status: taskStatus,
              tags: taskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
            }
          : t
      )
    );
    toast({ title: "Task Updated", description: `"${taskName}" has been updated.` });
    resetFormFields();
    setEditingTask(null);
    setIsEditDialogOpen(false);
  };


  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.name}" has been removed.`, variant: "destructive" });
    }
  };

  const handleChangeTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const moveTask = (taskId: string, direction: 'prev' | 'next') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = statusColumns.indexOf(task.status);
    let newIndex = currentIndex;

    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < statusColumns.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      handleChangeTaskStatus(taskId, statusColumns[newIndex]);
    }
  };

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className="mb-3 shadow-md hover:shadow-lg transition-shadow duration-200 bg-card">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium leading-tight">{task.name}</CardTitle>
          {getStatusIcon(task.status)}
        </div>
        {task.description && <CardDescription className="text-xs mt-1">{task.description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        {(task.assignee || task.dueDate) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {task.assignee && (
              <div className="flex items-center gap-1 min-w-0"> {/* Added min-w-0 for flex child truncation */}
                <Avatar className="h-5 w-5 flex-shrink-0"> {/* Added flex-shrink-0 */}
                  <AvatarImage src={task.assigneeAvatar} alt={task.assignee || 'User'} data-ai-hint="assignee avatar" />
                  <AvatarFallback>{task.assignee ? task.assignee.substring(0,1) : 'U'}</AvatarFallback>
                </Avatar>
                <span className="truncate min-w-0">{task.assignee}</span> {/* Added truncate and min-w-0 */}
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1 flex-shrink-0"> {/* Added flex-shrink-0 */}
                <CalendarDays className="h-3 w-3" />
                <span>{task.dueDate}</span>
              </div>
            )}
          </div>
        )}
        {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
                {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
            </div>
        )}
      </CardContent>
      <CardFooter className="px-3 py-2 border-t flex justify-between items-center">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveTask(task.id, 'prev')} disabled={statusColumns.indexOf(task.status) === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditDialog(task)}>
                <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteTask(task.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveTask(task.id, 'next')} disabled={statusColumns.indexOf(task.status) === statusColumns.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  const TaskDialogContent = ({ formId, onSubmit, title, description, buttonText }: { formId: string, onSubmit: (event: FormEvent<HTMLFormElement>) => void, title: string, description: string, buttonText: string }) => (
    <>
      <DialogHeader className="p-6 pb-2 flex-shrink-0">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto px-6">
        <form onSubmit={onSubmit} id={formId} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="taskName">Task Name</Label>
            <Input id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="taskDescription">Description (Optional)</Label>
            <Textarea id="taskDescription" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="mt-1" placeholder="Brief description of the task..." />
          </div>
          <div>
            <Label htmlFor="taskAssignee">Assignee (Optional)</Label>
            <Input id="taskAssignee" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="mt-1" placeholder="e.g., Jane Doe / Engineering Lead" />
          </div>
          <div>
            <Label htmlFor="taskDueDate">Due Date (Optional)</Label>
            <Input id="taskDueDate" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="taskTags">Tags (Optional, comma-separated)</Label>
            <Input id="taskTags" value={taskTags} onChange={(e) => setTaskTags(e.target.value)} className="mt-1" placeholder="e.g., UX, Backend, Urgent" />
          </div>
          <div>
            <Label htmlFor="taskStatus">Status</Label>
            <Select value={taskStatus} onValueChange={(value: TaskStatus) => setTaskStatus(value)}>
              <SelectTrigger id="taskStatus" className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusColumns.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>
      <DialogModalFooter className="p-6 pt-2 border-t flex-shrink-0">
        <Button type="button" variant="outline" onClick={() => isAddDialogOpen ? setIsAddDialogOpen(false) : setIsEditDialogOpen(false)}>Cancel</Button>
        <Button type="submit" form={formId}>{buttonText}</Button>
      </DialogModalFooter>
    </>
  );


  return (
    <>
      <PageHeader title="Task Management Board" description="Organize, track, and manage your project tasks.">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => toast({ title: "GitHub Sync (Mock)", description: "This would initiate GitHub project sync."})}>
            <Github className="mr-2 h-4 w-4" /> Connect to GitHub (Mock)
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetFormFields(); setIsAddDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] max-h-[calc(100vh-4rem)] flex flex-col">
              <TaskDialogContent
                formId="addTaskForm"
                onSubmit={handleAddTask}
                title="Add New Task"
                description="Fill in the details for your new task."
                buttonText="Add Task"
              />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[calc(100vh-4rem)] flex flex-col">
            <TaskDialogContent
                formId="editTaskForm"
                onSubmit={handleEditTask}
                title="Edit Task"
                description="Update the details of your task."
                buttonText="Save Changes"
            />
        </DialogContent>
      </Dialog>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {statusColumns.map(status => (
          <Card key={status} className="shadow-lg flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between text-lg">
                {status}
                <Badge variant="secondary">{tasks.filter(t => t.status === status).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow min-h-[300px]">
              <ScrollArea className="h-[calc(100vh-22rem)] pr-3"> 
                {tasks.filter(t => t.status === status).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks in {status}.</p>
                ) : (
                  tasks.filter(t => t.status === status).map(task => renderTaskCard(task))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
       <style jsx global>{`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
