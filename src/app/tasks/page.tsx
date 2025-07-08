
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as DialogModalFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Github, PlusCircle, Trash2, ChevronLeft, ChevronRight, Circle, RefreshCw, CheckCircle, CalendarDays, Edit3, Columns, Edit } from 'lucide-react';
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

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const twoWeeks = new Date(today);
twoWeeks.setDate(today.getDate() + 14);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() -1);

const formatDate = (date: Date) => date.toISOString().split('T')[0];


const initialTasks: Task[] = [
  // Todo
  {
    id: 'task-1',
    name: 'Draft Q3 Marketing Plan',
    assignee: 'Sarah Miller',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'woman avatar',
    dueDate: formatDate(nextWeek),
    status: 'Todo',
    tags: ['Marketing', 'Planning'],
  },
  {
    id: 'task-2',
    name: 'Research New CRM Software',
    assignee: 'John Doe',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'man avatar',
    dueDate: formatDate(twoWeeks),
    status: 'Todo',
    tags: ['Sales', 'Research'],
  },
  {
    id: 'task-3',
    name: 'Onboard New Hire - Alex',
    description: 'Complete all onboarding steps for Alex: HR paperwork, system access, team introductions, initial project assignment.',
    assignee: 'HR Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'team avatar',
    status: 'Todo',
    tags: ['HR', 'Onboarding'],
  },
  {
    id: 'task-9',
    name: 'Plan Team Building Event',
    assignee: 'Admin Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'group avatar',
    status: 'Todo',
    tags: ['HR', 'Event'],
  },
  { 
    id: 'task-15',
    name: 'Update Employee Handbook',
    description: 'Review and update the employee handbook with new policies for remote work and benefits.',
    assignee: 'HR Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'team avatar',
    status: 'Todo',
    tags: ['HR', 'Policy'],
  },
  { 
    id: 'task-16',
    name: 'Sixth Todo Task - Long content check',
    description: 'This is a sixth task for the Todo column to ensure vertical scrolling appears. This description needs to be long enough to make the card itself a bit taller, and combined with other cards, it should exceed the container height. We are adding more details here: review project scope, define deliverables, allocate resources, set timeline, schedule kick-off meeting. Ensure all stakeholders are aligned with the project goals. This is a test task for vertical scrolling in the Todo column. This task involves multiple steps and requires careful planning. The goal is to check if the vertical scrollbar appears when the content overflows the available height. This text is intentionally made very long to ensure the task card content pushes the limits of its container if the container height is constrained and scroll is enabled. If this text does not make the card scroll, the problem might be with the parent container heights rather than the content itself. Still adding more text to be absolutely sure. The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. This is a sixth task for the Todo column to ensure vertical scrolling appears. This description needs to be long enough to make the card itself a bit taller, and combined with other cards, it should exceed the container height. We are adding more details here: review project scope, define deliverables, allocate resources, set timeline, schedule kick-off meeting. Ensure all stakeholders are aligned with the project goals. This is a test task for vertical scrolling in the Todo column. This task involves multiple steps and requires careful planning. The goal is to check if the vertical scrollbar appears when the content overflows the available height. This text is intentionally made very long to ensure the task card content pushes the limits of its container if the container height is constrained and scroll is enabled. If this text does not make the card scroll, the problem might be with the parent container heights rather than the content itself. Still adding more text to be absolutely sure. The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
    assignee: 'Alice Wonderland',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'woman avatar',
    dueDate: formatDate(nextWeek),
    status: 'Todo',
    tags: ['Test', 'Scrolling', 'Urgent'],
  },
   { 
    id: 'task-17',
    name: 'Seventh Todo Task',
    description: 'Another task to ensure sufficient content for scrolling. This will involve checking API documentation and integrating a new payment gateway.',
    assignee: 'Bob The Builder',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'man avatar',
    status: 'Todo',
    tags: ['General', 'API'],
  },
  { 
    id: 'task-18',
    name: 'Eighth Todo Task',
    description: 'Design new UI mockups for the user profile page, incorporating feedback from the latest review session.',
    assignee: 'UI/UX Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'design team',
    dueDate: formatDate(twoWeeks),
    status: 'Todo',
    tags: ['UI', 'Design'],
  },
  { 
    id: 'task-19',
    name: 'Ninth Todo Task',
    description: 'Prepare agenda and presentation materials for the upcoming quarterly review meeting with stakeholders.',
    assignee: 'Project Manager',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'manager avatar',
    status: 'Todo',
    tags: ['Meeting', 'Admin'],
  },
  {
    id: 'task-20',
    name: 'Tenth Todo Task - More Content',
    description: 'This is another task to ensure vertical scrolling is triggered in the "Todo" column. Review last quarter\'s performance reports.',
    assignee: 'Analytics Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'analytics team',
    status: 'Todo',
    tags: ['Analytics', 'Report'],
  },
  {
    id: 'task-21',
    name: 'Eleventh Todo Task - Even More Content',
    description: 'This task involves brainstorming new feature ideas for the next product iteration based on user feedback.',
    assignee: 'Product Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'product team',
    dueDate: formatDate(nextWeek),
    status: 'Todo',
    tags: ['Product', 'Feature'],
  },
  // In Progress
  {
    id: 'task-4',
    name: 'Develop Homepage Redesign',
    assignee: 'Mike Chen',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'developer avatar',
    dueDate: formatDate(tomorrow),
    status: 'In Progress',
    tags: ['Frontend', 'Urgent'],
    description: 'Implement the new homepage design based on Figma mockups. Ensure responsiveness and accessibility for all screen sizes. Coordinate with backend for API integration points.',
  },
  {
    id: 'task-5',
    name: 'Write Blog Post on Industry Trends',
    assignee: 'Laura Smith',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'writer avatar',
    status: 'In Progress',
    tags: ['Content', 'Marketing'],
  },
  {
    id: 'task-10',
    name: 'Setup CI/CD Pipeline',
    assignee: 'DevOps Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'devops team',
    dueDate: formatDate(nextWeek),
    status: 'In Progress',
    tags: ['DevOps', 'Infra'],
  },
  // Review
  {
    id: 'task-6',
    name: 'Review PR #45 for Feature X',
    assignee: 'Jane DevRel',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'reviewer avatar',
    status: 'Review',
    tags: ['Code Review', 'Backend'],
  },
  {
    id: 'task-11',
    name: 'Test New User Authentication Flow',
    assignee: 'QA Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'qa team',
    status: 'Review',
    tags: ['QA', 'Testing'],
  },
  {
    id: 'task-12',
    name: 'Finalize Q3 Budget Proposal',
    description: 'Review the draft budget with finance and get final approval.',
    assignee: 'Finance Lead',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'finance avatar',
    dueDate: formatDate(tomorrow),
    status: 'Review',
    tags: ['Finance', 'Admin'],
  },
  // Done
  {
    id: 'task-7',
    name: 'Fix Login Page Bug #123',
    assignee: 'David Lee',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'engineer avatar',
    dueDate: formatDate(yesterday),
    status: 'Done',
    tags: ['Backend', 'Bugfix'],
  },
  {
    id: 'task-8',
    name: 'Client Meeting - Project Alpha Kickoff',
    description: 'Successfully conducted the kickoff meeting for Project Alpha. Action items distributed to relevant team members. Meeting minutes have been shared.',
    status: 'Done',
    tags: ['Client', 'Meeting'],
  },
  {
    id: 'task-13',
    name: 'Publish Company Newsletter - May',
    assignee: 'Marketing Team',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'marketing team',
    status: 'Done',
    tags: ['Marketing', 'Comms'],
  },
  {
    id: 'task-14',
    name: 'Server Maintenance - May Cycle',
    description: 'Completed scheduled server maintenance. All systems operational.',
    assignee: 'IT Ops',
    assigneeAvatar: 'https://placehold.co/40x40.png',
    dataAiHint: 'it team',
    dueDate: formatDate(yesterday),
    status: 'Done',
    tags: ['Infra', 'Maintenance'],
  },
];

interface TaskDialogContentProps {
  formId: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
  description: string;
  buttonText: string;
  currentStatusList: TaskStatus[];
  taskName: string;
  setTaskName: React.Dispatch<React.SetStateAction<string>>;
  taskDescription: string;
  setTaskDescription: React.Dispatch<React.SetStateAction<string>>;
  taskAssignee: string;
  setTaskAssignee: React.Dispatch<React.SetStateAction<string>>;
  taskDueDate: string;
  setTaskDueDate: React.Dispatch<React.SetStateAction<string>>;
  taskStatus: TaskStatus;
  setTaskStatus: React.Dispatch<React.SetStateAction<TaskStatus>>;
  taskTags: string;
  setTaskTags: React.Dispatch<React.SetStateAction<string>>;
  onCancel: () => void;
}

// Moved TaskDialogContent outside of TasksPage for stability
const TaskDialogContent = ({
  formId,
  onSubmit,
  title,
  description,
  buttonText,
  currentStatusList,
  taskName, setTaskName,
  taskDescription, setTaskDescription,
  taskAssignee, setTaskAssignee,
  taskDueDate, setTaskDueDate,
  taskStatus, setTaskStatus,
  taskTags, setTaskTags,
  onCancel,
}: TaskDialogContentProps) => (
  <>
    <DialogHeader className="p-6 pb-2 flex-shrink-0">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <div className="flex-grow overflow-y-auto px-6">
      <form onSubmit={onSubmit} id={`${formId}-form`} className="grid gap-4 py-4">
        <div>
          <Label htmlFor={`${formId}-taskNameInput`}>Task Name</Label>
          <Input id={`${formId}-taskNameInput`} value={taskName} onChange={(e) => setTaskName(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor={`${formId}-taskDescriptionInput`}>Description (Optional)</Label>
          <Textarea id={`${formId}-taskDescriptionInput`} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="mt-1" placeholder="Brief description of the task..." />
        </div>
        <div>
          <Label htmlFor={`${formId}-taskAssigneeInput`}>Assignee (Optional)</Label>
          <Input id={`${formId}-taskAssigneeInput`} value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="mt-1" placeholder="e.g., Jane Doe / Engineering Lead" />
        </div>
        <div>
          <Label htmlFor={`${formId}-taskDueDateInput`}>Due Date (Optional)</Label>
          <Input id={`${formId}-taskDueDateInput`} type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor={`${formId}-taskTagsInput`}>Tags (Optional, comma-separated)</Label>
          <Input id={`${formId}-taskTagsInput`} value={taskTags} onChange={(e) => setTaskTags(e.target.value)} className="mt-1" placeholder="e.g., UX, Backend, Urgent" />
        </div>
        {currentStatusList.length > 0 ? (
          <div>
              <Label htmlFor={`${formId}-taskStatusSelect`}>Status</Label>
              <Select value={taskStatus} onValueChange={(value: TaskStatus) => setTaskStatus(value)}>
              <SelectTrigger id={`${formId}-taskStatusSelect`} className="mt-1">
                  <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                  {currentStatusList.map(statusItem => (
                  <SelectItem key={statusItem} value={statusItem}>{statusItem}</SelectItem>
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
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      <Button type="submit" form={`${formId}-form`}>{buttonText}</Button>
    </DialogModalFooter>
  </>
);


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [boardColumns, setBoardColumns] = useState<TaskStatus[]>(['Todo', 'In Progress', 'Review', 'Done']);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(boardColumns[0] || '');
  const [taskTags, setTaskTags] = useState('');
  const [newColumnName, setNewColumnName] = useState('');

  const { toast } = useToast();
  
  const resetFormFields = useCallback(() => {
    setTaskName('');
    setTaskDescription('');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskTags('');
    if (boardColumns.length > 0 && (!taskStatus || !boardColumns.includes(taskStatus))) {
        setTaskStatus(boardColumns[0]);
    } else if (boardColumns.length === 0 && taskStatus !== '') {
        setTaskStatus('');
    }
  }, [boardColumns, taskStatus]);

  const onDialogCancel = useCallback(() => {
    resetFormFields();
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingTask(null);
  }, [resetFormFields]);

  useEffect(() => {
    if (boardColumns.length > 0 && (!taskStatus || !boardColumns.includes(taskStatus))) {
      setTaskStatus(boardColumns[0]);
    } else if (boardColumns.length === 0 && taskStatus !== '') { 
      setTaskStatus(''); 
    }
  }, [boardColumns, taskStatus]);

  const getStatusIcon = useCallback((status: TaskStatus) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'done') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (lowerStatus.includes('progress')) return <RefreshCw className="h-5 w-5 text-blue-500" />; // Changed to blue
    if (lowerStatus.includes('review')) return <Edit className="h-5 w-5 text-yellow-500" />; // Changed to yellow-500 for better visibility
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  }, []);
  
  const handleOpenAddTaskDialog = useCallback((defaultStatus?: TaskStatus) => {
    resetFormFields(); 
    if (defaultStatus && boardColumns.includes(defaultStatus)) {
      setTaskStatus(defaultStatus);
    } else if (boardColumns.length > 0) {
      setTaskStatus(boardColumns[0]);
    } else {
      setTaskStatus(''); 
      if (boardColumns.length === 0) { 
        toast({ title: "No Columns", description: "Please add a column first to assign a status.", variant: "destructive"});
        return; 
      }
    }
    setEditingTask(null);
    setIsAddDialogOpen(true);
  }, [boardColumns, resetFormFields, toast, setTaskStatus]);

  const handleAddTask = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskName.trim()) {
      toast({ title: "Task name required", description: "Please enter a name for the task.", variant: "destructive" });
      return;
    }
    if (!taskStatus && boardColumns.length > 0) {
       toast({ title: "Status required", description: "Please select a status for the task.", variant: "destructive" });
      return;
    }
    if (boardColumns.length === 0 && taskStatus === '') { 
      toast({ title: "No columns exist", description: "Please add a column before adding a task.", variant: "destructive" });
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: taskName.trim(),
      description: taskDescription.trim() || undefined,
      assignee: taskAssignee.trim() || undefined,
      assigneeAvatar: taskAssignee.trim() ? `https://placehold.co/40x40.png` : undefined,
      dataAiHint: taskAssignee.trim() ? 'person placeholder' : undefined,
      dueDate: taskDueDate.trim() || undefined,
      status: taskStatus,
      tags: taskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast({ title: "Task Added", description: `"${newTask.name}" has been added to ${newTask.status}.` });
    onDialogCancel();
  }, [taskName, taskDescription, taskAssignee, taskDueDate, taskStatus, taskTags, boardColumns, toast, onDialogCancel]);

  const handleOpenEditDialog = useCallback((task: Task) => {
    resetFormFields(); 
    setEditingTask(task);
    setTaskName(task.name);
    setTaskDescription(task.description || '');
    setTaskAssignee(task.assignee || '');
    setTaskDueDate(task.dueDate || '');
    setTaskStatus(task.status);
    setTaskTags(task.tags?.join(', ') || '');
    setIsEditDialogOpen(true);
  }, [resetFormFields]);

  const handleEditTask = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
     if (!taskName.trim()) {
      toast({ title: "Task name required", variant: "destructive" });
      return;
    }
    if (!taskStatus && boardColumns.length > 0) {
      toast({ title: "Status required", variant: "destructive" });
      return;
    }
    if (boardColumns.length === 0 && taskStatus === '') {
      toast({ title: "No columns exist", description: "Please add a column before adding a task.", variant: "destructive" });
      return;
    }

    if (editingTask) {
      const updatedTaskData = {
        name: taskName.trim(),
        description: taskDescription.trim() || undefined,
        assignee: taskAssignee.trim() || undefined,
        assigneeAvatar: taskAssignee.trim() ? `https://placehold.co/40x40.png` : undefined,
        dataAiHint: taskAssignee.trim() ? 'person placeholder' : undefined,
        dueDate: taskDueDate.trim() || undefined,
        status: taskStatus,
        tags: taskTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === editingTask.id ? { ...editingTask, ...updatedTaskData } : t
        )
      );
      toast({ title: "Task Updated", description: `"${updatedTaskData.name}" has been updated.` });
      onDialogCancel();
    }
  }, [editingTask, taskName, taskDescription, taskAssignee, taskDueDate, taskStatus, taskTags, boardColumns, toast, onDialogCancel]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.name}" has been removed.`, variant: "destructive" });
    }
  }, [tasks, toast]);

  const handleChangeTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  }, []);

  const moveTask = useCallback((taskId: string, direction: 'prev' | 'next') => {
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
  }, [tasks, boardColumns, handleChangeTaskStatus]);

  const handleAddColumn = useCallback((event: FormEvent<HTMLFormElement>) => {
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
    setBoardColumns(prev => {
      const newColumns = [...prev, trimmedNewColumnName];
      if (prev.length === 0 && taskStatus === '') { 
        setTaskStatus(trimmedNewColumnName); 
      } else if (prev.length > 0 && taskStatus === '' && newColumns.length > 0) {
        setTaskStatus(newColumns[0]);
      }
      return newColumns;
    });
    toast({ title: "Column Added", description: `Column "${trimmedNewColumnName}" has been added.` });
    setNewColumnName('');
    setIsAddColumnDialogOpen(false);
  }, [newColumnName, boardColumns, taskStatus, toast, setTaskStatus]);
  

  const renderTaskCard = useCallback((task: Task) => (
    <Card key={task.id} className="mb-3 shadow-md hover:shadow-lg transition-shadow duration-200 bg-card">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium leading-tight">{task.name}</CardTitle>
          {getStatusIcon(task.status)}
        </div>
        {task.description && (
            <CardDescription className="text-xs mt-1 max-h-20 overflow-y-auto">
                {task.description}
            </CardDescription>
        )}
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
  ), [getStatusIcon, boardColumns, handleOpenEditDialog, handleDeleteTask, moveTask]);
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Task Management Board" description="Organize, track, and manage your project tasks.">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => toast({ title: "GitHub Sync (Mock)", description: "This would initiate GitHub project sync."})}>
            <Github className="mr-2 h-4 w-4" /> Connect to GitHub (Mock)
          </Button>
          <Dialog open={isAddColumnDialogOpen} onOpenChange={(open) => { if(!open) setNewColumnName(''); setIsAddColumnDialogOpen(open);}}>
            <DialogTrigger asChild>
                <Button variant="outline">
                  <Columns className="mr-2 h-4 w-4" /> Add Column
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Add New Column</DialogTitle>
                <DialogDescription>Enter a name for your new Kanban column.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddColumn} id="addColumnFormDialog-form" className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="addColumnFormDialog-newColumnNameFormInput">Column Name</Label>
                  <Input id="addColumnFormDialog-newColumnNameFormInput" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} className="mt-1" required />
                </div>
              </form>
              <DialogModalFooter>
                 <Button type="button" variant="outline" onClick={() => {setNewColumnName(''); setIsAddColumnDialogOpen(false)}}>Cancel</Button>
                <Button type="submit" form="addColumnFormDialog-form">Add Column</Button>
              </DialogModalFooter>
            </DialogContent>
          </Dialog>
           <Button onClick={() => handleOpenAddTaskDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
          </Button>
        </div>
      </PageHeader>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if(!open) onDialogCancel(); else setIsAddDialogOpen(true); }}>
        <DialogContent 
          key="add-task-dialog" 
          className="sm:max-w-[480px] max-h-[calc(100vh-4rem)] flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <TaskDialogContent
            formId="addTaskFormDialog"
            onSubmit={handleAddTask}
            title="Add New Task"
            description="Fill in the details for your new task."
            buttonText="Add Task"
            currentStatusList={boardColumns}
            taskName={taskName} setTaskName={setTaskName}
            taskDescription={taskDescription} setTaskDescription={setTaskDescription}
            taskAssignee={taskAssignee} setTaskAssignee={setTaskAssignee}
            taskDueDate={taskDueDate} setTaskDueDate={setTaskDueDate}
            taskStatus={taskStatus} setTaskStatus={setTaskStatus}
            taskTags={taskTags} setTaskTags={setTaskTags}
            onCancel={onDialogCancel}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if(!open) onDialogCancel(); else setIsEditDialogOpen(true); }}>
        <DialogContent 
          key="edit-task-dialog" 
          className="sm:max-w-[480px] max-h-[calc(100vh-4rem)] flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
            <TaskDialogContent
                formId="editTaskFormDialog"
                onSubmit={handleEditTask}
                title="Edit Task"
                description="Update the details of your task."
                buttonText="Save Changes"
                currentStatusList={boardColumns}
                taskName={taskName} setTaskName={setTaskName}
                taskDescription={taskDescription} setTaskDescription={setTaskDescription}
                taskAssignee={taskAssignee} setTaskAssignee={setTaskAssignee}
                taskDueDate={taskDueDate} setTaskDueDate={setTaskDueDate}
                taskStatus={taskStatus} setTaskStatus={setTaskStatus}
                taskTags={taskTags} setTaskTags={setTaskTags}
                onCancel={onDialogCancel}
            />
        </DialogContent>
      </Dialog>
      
      {/* Container for Kanban columns - scrolls horizontally */}
      <div className="flex overflow-x-auto gap-6 pb-4 items-stretch flex-1">
        {boardColumns.length === 0 && (
          <div className="w-full text-center py-10 flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">No columns yet. Click "Add Column" to get started!</p>
          </div>
        )}
        {boardColumns.map(columnName => (
          <Card key={columnName} className="shadow-lg transition-shadow duration-300 hover:shadow-2xl flex flex-col w-[320px] flex-shrink-0"> {/* Column Card */}
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
            <CardContent className="p-0 flex-1 min-h-0 overflow-hidden"> {/* Content area for tasks - takes remaining height, clips overflow */}
              <ScrollArea className="h-full w-full p-4"> {/* ScrollArea for vertical task scrolling */}
                {tasks.filter(t => t.status === columnName).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks in {columnName}.</p>
                ) : (
                  tasks.filter(t => t.status === columnName).map(task => renderTaskCard(task))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
    
