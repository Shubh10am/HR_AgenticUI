
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
import { Github, PlusCircle, Trash2, ChevronLeft, ChevronRight, Circle, RefreshCw, CheckCircle, CalendarDays, User, Edit3, Columns } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskStatus = string; 

interface Task {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  assigneeAvatar?: string; 
  dataAiHint?: string;
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [boardColumns, setBoardColumns] = useState<TaskStatus[]>(['Todo', 'In Progress', 'Done']);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(boardColumns[0] || 'Todo');
  const [taskTags, setTaskTags] = useState('');
  const [newColumnName, setNewColumnName] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    if (boardColumns.length > 0 && !boardColumns.includes(taskStatus)) {
      setTaskStatus(boardColumns[0]);
    } else if (boardColumns.length === 0 && taskStatus !== '') {
      setTaskStatus(''); 
    }
  }, [boardColumns, taskStatus]);

  const getStatusIcon = (status: TaskStatus) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'done') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (lowerStatus === 'in progress') return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin-slow" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const resetFormFields = () => {
    setTaskName('');
    setTaskDescription('');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskTags('');
    if (boardColumns.length > 0) {
      setTaskStatus(boardColumns[0]); 
    } else {
      setTaskStatus(''); 
    }
  };
  
 const handleOpenAddTaskDialog = (defaultStatus?: TaskStatus) => {
    resetFormFields();
    if (defaultStatus && boardColumns.includes(defaultStatus)) {
      setTaskStatus(defaultStatus);
    } else if (boardColumns.length > 0) {
      setTaskStatus(boardColumns[0]);
    } else {
      setTaskStatus(''); // Or handle the case where no columns exist
    }
    setEditingTask(null);
    setIsAddDialogOpen(true);
  };

  const handleAddOrEditTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskName.trim()) {
      toast({ title: "Task name required", description: "Please enter a name for the task.", variant: "destructive" });
      return;
    }
    if (!taskStatus && boardColumns.length > 0) {
       toast({ title: "Status required", description: "Please select a status for the task.", variant: "destructive" });
      return;
    }
     if (boardColumns.length === 0 && taskStatus !== '') { // Should not happen if status select is disabled
      toast({ title: "No columns exist", description: "Please add a column before adding a task.", variant: "destructive" });
      return;
    }


    const taskData = {
      name: taskName.trim(),
      description: taskDescription.trim() || undefined,
      assignee: taskAssignee.trim() || undefined,
      assigneeAvatar: taskAssignee.trim() ? `https://placehold.co/40x40.png` : undefined, // Generic placeholder
      dataAiHint: taskAssignee.trim() ? 'person placeholder' : undefined,
      dueDate: taskDueDate.trim() || undefined,
      status: taskStatus,
      tags: taskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    if (editingTask) {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === editingTask.id ? { ...editingTask, ...taskData } : t
        )
      );
      toast({ title: "Task Updated", description: `"${taskData.name}" has been updated.` });
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      toast({ title: "Task Added", description: `"${newTask.name}" has been added to ${newTask.status}.` });
      setIsAddDialogOpen(false);
    }
    resetFormFields(); // Reset form fields for next entry
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

    const currentIndex = boardColumns.indexOf(task.status);
    let newIndex = currentIndex;

    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < boardColumns.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      handleChangeTaskStatus(taskId, boardColumns[newIndex]);
    }
  };

  const handleAddColumn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedNewColumnName = newColumnName.trim();
    if (!trimmedNewColumnName) {
      toast({ title: "Column name required", variant: "destructive" });
      return;
    }
    if (boardColumns.map(c => c.toLowerCase()).includes(trimmedNewColumnName.toLowerCase())) {
      toast({ title: "Column already exists", description: "Please use a unique column name.", variant: "destructive" });
      return;
    }
    setBoardColumns(prev => [...prev, trimmedNewColumnName]);
    if (boardColumns.length === 0 && taskStatus === '') { 
      setTaskStatus(trimmedNewColumnName); 
    }
    toast({ title: "Column Added", description: `Column "${trimmedNewColumnName}" has been added.` });
    setNewColumnName('');
    setIsAddColumnDialogOpen(false);
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
          <div className="flex items-center justify-between text-xs text-muted-foreground min-w-0">
            {task.assignee && (
              <div className="flex items-center gap-1 min-w-0"> 
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage src={task.assigneeAvatar} alt={task.assignee || 'User'} data-ai-hint={task.dataAiHint || "person avatar"} />
                  <AvatarFallback>{task.assignee ? task.assignee.substring(0,1).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <span className="truncate min-w-0">{task.assignee}</span> 
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1 flex-shrink-0"> 
                <CalendarDays className="h-3 w-3" />
                <span>{task.dueDate}</span>
              </div>
            )}
          </div>
        )}
        {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
            </div>
        )}
      </CardContent>
      <CardFooter className="px-3 py-2 border-t flex justify-between items-center">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveTask(task.id, 'prev')} disabled={boardColumns.indexOf(task.status) === 0}>
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
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveTask(task.id, 'next')} disabled={boardColumns.indexOf(task.status) === boardColumns.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
  
  const TaskDialogContent = ({ formId, onSubmit, title, description, buttonText, currentStatusList }: { formId: string, onSubmit: (event: FormEvent<HTMLFormElement>) => void, title: string, description: string, buttonText: string, currentStatusList: string[] }) => (
    <>
      <DialogHeader className="p-6 pb-2 flex-shrink-0">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto px-6">
        <form onSubmit={onSubmit} id={formId} className="grid gap-4 py-4">
          <div>
            <Label htmlFor={`${formId}-taskName`}>Task Name</Label>
            <Input id={`${formId}-taskName`} value={taskName} onChange={(e) => setTaskName(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor={`${formId}-taskDescription`}>Description (Optional)</Label>
            <Textarea id={`${formId}-taskDescription`} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="mt-1" placeholder="Brief description of the task..." />
          </div>
          <div>
            <Label htmlFor={`${formId}-taskAssignee`}>Assignee (Optional)</Label>
            <Input id={`${formId}-taskAssignee`} value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="mt-1" placeholder="e.g., Jane Doe / Engineering Lead" />
          </div>
          <div>
            <Label htmlFor={`${formId}-taskDueDate`}>Due Date (Optional)</Label>
            <Input id={`${formId}-taskDueDate`} type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor={`${formId}-taskTags`}>Tags (Optional, comma-separated)</Label>
            <Input id={`${formId}-taskTags`} value={taskTags} onChange={(e) => setTaskTags(e.target.value)} className="mt-1" placeholder="e.g., UX, Backend, Urgent" />
          </div>
          {currentStatusList.length > 0 ? (
            <div>
                <Label htmlFor={`${formId}-taskStatus`}>Status</Label>
                <Select value={taskStatus} onValueChange={(value: TaskStatus) => setTaskStatus(value)}>
                <SelectTrigger id={`${formId}-taskStatus`} className="mt-1">
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    {currentStatusList.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
             ) : (
            <p className="text-sm text-muted-foreground">Add a column to set task status.</p>
          )}
        </form>
      </div>
      <DialogModalFooter className="p-6 pt-2 border-t flex-shrink-0">
        <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>Cancel</Button>
        <Button type="submit" form={formId}>{buttonText}</Button>
      </DialogModalFooter>
    </>
  );

  return (
    <div className="flex flex-col h-full"> 
      <PageHeader title="Task Management Board" description="Organize, track, and manage your project tasks.">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => toast({ title: "GitHub Sync (Mock)", description: "This would initiate GitHub project sync."})}>
            <Github className="mr-2 h-4 w-4" /> Connect to GitHub (Mock)
          </Button>
          <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => { setNewColumnName(''); setIsAddColumnDialogOpen(true); }}>
                <Columns className="mr-2 h-4 w-4" /> Add Column
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Column</DialogTitle>
                <DialogDescription>Enter a name for your new Kanban column.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddColumn} id="addColumnForm" className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="newColumnNameForm">Column Name</Label>
                  <Input id="newColumnNameForm" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} className="mt-1" required />
                </div>
              </form>
              <DialogModalFooter>
                 <Button type="button" variant="outline" onClick={() => setIsAddColumnDialogOpen(false)}>Cancel</Button>
                <Button type="submit" form="addColumnForm">Add Column</Button>
              </DialogModalFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => handleOpenAddTaskDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
          </Button>
        </div>
      </PageHeader>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if(!open) { setEditingTask(null); resetFormFields(); } setIsAddDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[480px] max-h-[calc(100vh-4rem)] flex flex-col">
          <TaskDialogContent
            formId="addTaskForm"
            onSubmit={handleAddOrEditTask}
            title="Add New Task"
            description="Fill in the details for your new task."
            buttonText="Add Task"
            currentStatusList={boardColumns}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if(!open) { setEditingTask(null); resetFormFields(); } setIsEditDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[480px] max-h-[calc(100vh-4rem)] flex flex-col">
            <TaskDialogContent
                formId="editTaskForm"
                onSubmit={handleAddOrEditTask}
                title="Edit Task"
                description="Update the details of your task."
                buttonText="Save Changes"
                currentStatusList={boardColumns}
            />
        </DialogContent>
      </Dialog>
      
      <div className="flex overflow-x-auto gap-6 pb-4 items-start flex-grow">
        {boardColumns.map(columnName => (
          <Card key={columnName} className="shadow-lg flex flex-col w-[320px] flex-shrink-0">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center text-lg">
                  {columnName}
                  <Badge variant="secondary" className="ml-2">{tasks.filter(t => t.status === columnName).length}</Badge>
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenAddTaskDialog(columnName)}>
                  <PlusCircle className="h-5 w-5" />
                  <span className="sr-only">Add task to {columnName}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow min-h-[200px]">
              <ScrollArea className="h-full pr-3"> 
                {tasks.filter(t => t.status === columnName).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks in {columnName}.</p>
                ) : (
                  tasks.filter(t => t.status === columnName).map(task => renderTaskCard(task))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
         {boardColumns.length === 0 && (
          <div className="w-full text-center py-10 flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">No columns yet. Click "Add Column" to get started!</p>
          </div>
        )}
      </div>
       <style jsx global>{`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* For webkit browsers like Chrome, Safari */
        .overflow-x-auto::-webkit-scrollbar {
            height: 8px; 
        }
        .overflow-x-auto::-webkit-scrollbar-track {
            background: hsl(var(--secondary)); 
            border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground));
            border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--primary)); 
        }
        /* For Firefox */
        .overflow-x-auto {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground)) hsl(var(--secondary));
        }
      `}</style>
    </div>
  );
}
    
