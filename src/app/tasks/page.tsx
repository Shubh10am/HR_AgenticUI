
'use client';

import { useEffect, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent, type WheelEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Paperclip, MessageSquare, Send, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TaskStatus = 'Todo' | 'In Progress' | 'In Review' | 'Done';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  assignees: { name: string; avatarUrl: string, dataAiHint: string }[];
  attachments: number;
  comments: number;
  activity?: { id: string; text: string; author: string; createdAt: string }[];
}

const initialTasks: Task[] = [
  { id: 'task-1', title: 'Design the new dashboard layout', status: 'In Review', priority: 'High', assignees: [{ name: 'Alice', avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg', dataAiHint: 'woman face' }], attachments: 2, comments: 5 },
  { id: 'task-2', title: 'Develop the authentication API', status: 'In Progress', priority: 'High', assignees: [{ name: 'Bob', avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg', dataAiHint: 'man face' }], attachments: 0, comments: 8 },
  { id: 'task-3', title: 'Write documentation for the API', status: 'Todo', priority: 'Medium', assignees: [{ name: 'Charlie', avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg', dataAiHint: 'man face' }], attachments: 0, comments: 0 },
  { id: 'task-4', title: 'Fix the bug in the reporting module', status: 'In Progress', priority: 'High', assignees: [{ name: 'Diana', avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg', dataAiHint: 'woman face' }], attachments: 1, comments: 3 },
  { id: 'task-5', title: 'Set up the staging environment', status: 'Done', priority: 'Medium', assignees: [{ name: 'Eve', avatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg', dataAiHint: 'woman face' }], attachments: 0, comments: 1 },
  { id: 'task-6', title: 'Plan the Q4 marketing campaign', status: 'Todo', priority: 'Low', assignees: [], attachments: 5, comments: 2 },
  { id: 'task-7', title: 'Research new analytics tools', status: 'Todo', priority: 'Medium', assignees: [{ name: 'Frank', avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg', dataAiHint: 'man face' }], attachments: 0, comments: 0 },
  { id: 'task-8', title: 'User testing for the new feature', status: 'In Review', priority: 'High', assignees: [{ name: 'Grace', avatarUrl: 'https://randomuser.me/api/portraits/women/4.jpg', dataAiHint: 'woman face' }, { name: 'Heidi', avatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg', dataAiHint: 'woman face' }], attachments: 3, comments: 11 },
  { id: 'task-9', title: 'Update the company website', status: 'Done', priority: 'Low', assignees: [{ name: 'Ivan', avatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg', dataAiHint: 'man face' }], attachments: 0, comments: 0 },
  { id: 'task-10', title: 'Onboard new marketing intern', status: 'In Progress', priority: 'Medium', assignees: [{ name: 'Alice', avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg', dataAiHint: 'woman face' }], attachments: 1, comments: 1 },
  { id: 'task-11', title: 'Prepare Q3 financial report', status: 'Todo', priority: 'High', assignees: [{ name: 'Bob', avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg', dataAiHint: 'man face' }], attachments: 0, comments: 0 },
  { id: 'task-12', title: 'Migrate database to new server', status: 'Todo', priority: 'High', assignees: [{ name: 'Diana', avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg', dataAiHint: 'woman face' }, { name: 'Bob', avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg', dataAiHint: 'man face' }], attachments: 0, comments: 0 },
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoaded, setIsLoaded] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  useEffect(() => {
    try {
      const savedTasks = window.localStorage.getItem('hr-agentic-tasks');
      if (savedTasks) {
        const parsedTasks: unknown = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) setTasks(parsedTasks as Task[]);
      }
    } catch {
      window.localStorage.removeItem('hr-agentic-tasks');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem('hr-agentic-tasks', JSON.stringify(tasks));
    }
  }, [isLoaded, tasks]);

  const moveTask = (taskId: string, status: TaskStatus, beforeTaskId?: string) => {
    setTasks((currentTasks) => {
      const movingTask = currentTasks.find((task) => task.id === taskId);
      if (!movingTask) return currentTasks;

      const remainingTasks = currentTasks.filter((task) => task.id !== taskId);
      const updatedTask = { ...movingTask, status };
      const targetIndex = beforeTaskId
        ? remainingTasks.findIndex((task) => task.id === beforeTaskId)
        : -1;

      if (targetIndex < 0) {
        const lastTaskInColumn = remainingTasks.reduce(
          (lastIndex, task, index) => (task.status === status ? index : lastIndex),
          -1
        );
        remainingTasks.splice(lastTaskInColumn + 1, 0, updatedTask);
      } else {
        remainingTasks.splice(targetIndex, 0, updatedTask);
      }

      return remainingTasks;
    });
  };

  const handleColumnDrop = (event: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) moveTask(taskId, status);
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((currentTasks) => currentTasks.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const addComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = commentDraft.trim();
    if (!selectedTask || !text) return;

    updateTask(selectedTask.id, {
      comments: selectedTask.comments + 1,
      activity: [
        ...(selectedTask.activity ?? []),
        {
          id: `comment-${Date.now()}`,
          text,
          author: 'You',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setCommentDraft('');
  };

  const openTaskOnKeyboard = (event: KeyboardEvent<HTMLDivElement>, taskId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedTaskId(taskId);
    }
  };

  const handleBoardWheel = (event: WheelEvent<HTMLDivElement>) => {
    const horizontalDelta = event.shiftKey
      ? (event.deltaY || event.deltaX)
      : event.deltaX;
    if (!horizontalDelta || !boardScrollRef.current) return;

    const board = boardScrollRef.current;
    const maxScrollLeft = board.scrollWidth - board.clientWidth;
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, board.scrollLeft + horizontalDelta));
    if (nextScrollLeft !== board.scrollLeft) {
      event.preventDefault();
      board.scrollLeft = nextScrollLeft;
    }
  };

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[28rem] w-full min-w-0 flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <PageHeader
          title="Task Management Board"
          description="Visualize your team's workflow and track progress on tasks."
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New Task
          </Button>
        </PageHeader>
      </div>

      <div
        ref={boardScrollRef}
        onWheelCapture={handleBoardWheel}
        className="min-h-0 min-w-0 w-full flex-1 overflow-x-auto overflow-y-hidden rounded-xl border bg-card/40 p-3 pb-4"
      >
        <div className="grid h-full min-h-[28rem] w-max grid-flow-col auto-cols-[20rem] gap-4">
          {columns.map((status) => (
            <div
              key={status}
              className="flex h-full min-h-0 flex-col"
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverStatus(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragOverStatus(null);
                }
              }}
              onDrop={(event) => handleColumnDrop(event, status)}
            >
              <Card className={`flex h-full min-h-0 flex-col overflow-hidden bg-muted/50 transition-colors ${dragOverStatus === status ? 'ring-2 ring-primary/60' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b flex-shrink-0">
                  <CardTitle className="text-base font-semibold">
                    {status} ({tasks.filter((t) => t.status === status).length})
                  </CardTitle>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                  <CardContent className="p-2 space-y-2">
                    {tasks
                      .filter((task) => task.status === status)
                      .map((task) => (
                        <Card
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open ticket: ${task.title}`}
                          onClick={() => setSelectedTaskId(task.id)}
                          onKeyDown={(event) => openTaskOnKeyboard(event, task.id)}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', task.id);
                            setDraggedTaskId(task.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverStatus(null);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
                            if (taskId && taskId !== task.id) moveTask(taskId, status, task.id);
                            setDraggedTaskId(null);
                            setDragOverStatus(null);
                          }}
                          className={`bg-card shadow-sm transition-all cursor-grab active:cursor-grabbing ${draggedTaskId === task.id ? 'opacity-40' : 'hover:shadow-md'}`}
                        >
                          <CardContent className="p-3 space-y-2">
                            <p className="font-semibold text-sm whitespace-normal">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground whitespace-normal">{task.description}</p>
                            )}
                            <Badge
                              variant="outline"
                              className={getPriorityBadgeClass(task.priority)}
                            >
                              {task.priority}
                            </Badge>
                            <div className="flex justify-between items-center pt-2 border-t mt-2">
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                {task.attachments > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {task.attachments}
                                  </span>
                                )}
                                {task.comments > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {task.comments}
                                  </span>
                                )}
                              </div>
                              <div className="flex -space-x-2">
                                {task.assignees.map((assignee) => (
                                  <Avatar
                                    key={assignee.name}
                                    className="h-6 w-6 border-2 border-card"
                                  >
                                    <AvatarImage
                                      src={assignee.avatarUrl}
                                      alt={assignee.name}
                                      data-ai-hint={assignee.dataAiHint}
                                    />
                                    <AvatarFallback>
                                      {assignee.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </CardContent>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <Sheet
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskId(null);
            setCommentDraft('');
          }
        }}
      >
        {selectedTask && (
          <SheetContent className="flex w-full max-w-2xl flex-col gap-0 overflow-hidden bg-card p-0 text-card-foreground sm:max-w-2xl">
            <SheetHeader className="border-b px-6 py-5 pr-14 text-left">
              <SheetDescription className="text-xs font-medium uppercase tracking-[0.16em]">
                Ticket {selectedTask.id.toUpperCase()}
              </SheetDescription>
              <SheetTitle className="sr-only">Ticket details</SheetTitle>
              <Input
                aria-label="Ticket title"
                value={selectedTask.title}
                onChange={(event) => updateTask(selectedTask.id, { title: event.target.value })}
                className="h-auto border-0 px-0 text-xl font-semibold shadow-none focus-visible:ring-0 md:text-2xl"
              />
              <p className="text-sm text-muted-foreground">Update details, track progress, and add notes to this ticket.</p>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(status: TaskStatus) => moveTask(selectedTask.id, status)}
                  >
                    <SelectTrigger aria-label="Ticket status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {columns.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={selectedTask.priority}
                    onValueChange={(priority: Task['priority']) => updateTask(selectedTask.id, { priority })}
                  >
                    <SelectTrigger aria-label="Ticket priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Low', 'Medium', 'High'] as const).map((priority) => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Assignees</label>
                  <div className="flex min-h-10 items-center gap-2 rounded-md border px-3 py-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    {selectedTask.assignees.length ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.assignees.map((assignee) => (
                          <span key={assignee.name} className="rounded-full bg-muted px-2.5 py-1 text-xs">{assignee.name}</span>
                        ))}
                      </div>
                    ) : <span className="text-sm text-muted-foreground">Unassigned</span>}
                  </div>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Description</h3>
                <Textarea
                  aria-label="Ticket description"
                  value={selectedTask.description ?? ''}
                  onChange={(event) => updateTask(selectedTask.id, { description: event.target.value })}
                  placeholder="Add details, acceptance criteria, or links for this ticket…"
                  className="min-h-32 resize-y"
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Activity</h3>
                  <span className="text-xs text-muted-foreground">{selectedTask.comments} comments</span>
                </div>
                <div className="space-y-3">
                  {(selectedTask.activity ?? []).map((entry) => (
                    <div key={entry.id} className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{entry.author}</span>
                        <time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>
                          {new Date(entry.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{entry.text}</p>
                    </div>
                  ))}
                  {!selectedTask.activity?.length && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No new notes yet. Add a comment to start the discussion.
                    </p>
                  )}
                </div>
                <form onSubmit={addComment} className="space-y-2">
                  <Textarea
                    aria-label="Write a comment"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Write a comment…"
                    className="min-h-24 resize-y"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={!commentDraft.trim()}>
                      <Send className="mr-2 h-4 w-4" /> Add comment
                    </Button>
                  </div>
                </form>
              </section>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
