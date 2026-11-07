'use client';

import { format } from 'date-fns';
import { CornerDownRight, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PersonAvatar from '@/components/person-avatar';
import { GOAL_STATUS_META, type GoalStatus, type GoalView } from '@/lib/performance';
import { cn } from '@/lib/utils';

/** One goal with its key results; editors can change status and open the editor. */
export default function GoalCard({ goal, onStatus, onEdit, onDelete }: { goal: GoalView; onStatus: (status: GoalStatus) => void; onEdit: () => void; onDelete: () => void }) {
  const meta = GOAL_STATUS_META[goal.status];
  return (
    <Card id={`goal-${goal.id}`}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <PersonAvatar person={goal.owner} className="h-9 w-9 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug">{goal.title}</p>
            <p className="text-xs text-muted-foreground">
              {goal.owner.name}
              {goal.dueDate ? ` · due ${format(new Date(goal.dueDate), 'd MMM yyyy')}` : ''}
            </p>
            {goal.parentTitle && (
              <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                <CornerDownRight className="h-3 w-3" /> Supports: {goal.parentTitle}
              </p>
            )}
          </div>
          {goal.canEdit ? (
            <Select value={goal.status} onValueChange={(value) => onStatus(value as GoalStatus)}>
              <SelectTrigger id={`goal-${goal.id}-status`} className={cn('h-7 w-auto gap-1 rounded-full border-0 px-2.5 text-xs font-semibold', meta.tone)} aria-label="Goal status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GOAL_STATUS_META) as GoalStatus[]).map((status) => <SelectItem key={status} value={status}>{GOAL_STATUS_META[status].label}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', meta.tone)}>{meta.label}</span>
          )}
        </div>
        {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
        <div className="flex items-center gap-3">
          <Progress value={goal.progress} className="h-2 flex-1" />
          <span className="w-10 text-right text-sm font-semibold">{goal.progress}%</span>
        </div>
        {goal.keyResults.length > 0 && (
          <ul className="space-y-1.5">
            {goal.keyResults.map((kr) => (
              <li key={kr.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{kr.title}</span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {kr.current}/{kr.target} {kr.unit}
                </span>
                <Progress value={kr.progress} className="h-1.5 w-20" />
              </li>
            ))}
          </ul>
        )}
        {goal.canEdit && (
          <div className="flex justify-end gap-1 border-t pt-2">
            <Button id={`goal-${goal.id}-edit`} variant="ghost" size="sm" onClick={onEdit}><Pencil /> Update</Button>
            <Button id={`goal-${goal.id}-delete`} variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 /> Delete</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
