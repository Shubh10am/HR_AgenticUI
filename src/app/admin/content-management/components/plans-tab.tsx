'use client';

import { useState } from 'react';
import { Check, Pencil, PlusCircle, Star, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useAdminData } from '../../components/use-admin-data';
import { formatPrice, type Plan, type PlanDraft } from '../types';
import PlanDialog from './plan-dialog';

export default function PlansTab() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { data, error, reload } = useAdminData<{ plans: Plan[] }>('/api/admin/plans');
  const [editing, setEditing] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plan | null>(null);

  const openEditor = (plan: Plan | null) => { setEditing(plan); setIsDialogOpen(true); };

  const save = async (draft: PlanDraft): Promise<string | null> => {
    const response = await fetch(editing ? `/api/admin/plans/${editing._id}` : '/api/admin/plans', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(draft),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return body.error ?? 'Could not save the plan.';
    setIsDialogOpen(false);
    toast({ title: editing ? 'Plan updated' : 'Plan created', description: draft.name });
    await reload();
    return null;
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const response = await fetch(`/api/admin/plans/${deleting._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast(response.ok ? { title: 'Plan deleted', description: deleting.name } : { title: 'Could not delete the plan', variant: 'destructive' });
    setDeleting(null);
    await reload();
  };

  return (
    <Card>
      <CardHeader className="flex-col items-start justify-between gap-4 space-y-0 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-base">Subscription plans</CardTitle>
          <CardDescription>The tiers offered to organizations. Inactive plans are hidden from customers.</CardDescription>
        </div>
        <Button id="admin-plans-add" onClick={() => openEditor(null)}><PlusCircle className="mr-2 h-4 w-4" />Add plan</Button>
      </CardHeader>
      <CardContent>
        {error ? <p className="text-sm text-destructive">{error}</p> : !data ? (
          <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56" />)}</div>
        ) : data.plans.length === 0 ? (
          <div className="rounded-xl border border-dashed py-14 text-center">
            <p className="font-medium">No plans yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first plan to define what organizations can subscribe to.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.plans.map((plan) => (
              <Card key={plan._id} id={`admin-plan-${plan._id}`} className={cn('flex flex-col p-5', plan.isHighlighted && 'border-primary ring-1 ring-primary/30', !plan.isActive && 'opacity-60')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">{plan.name}{plan.isHighlighted && <Star className="h-4 w-4 fill-primary text-primary" />}</p>
                    <p className="mt-0.5 font-display text-2xl font-bold">{formatPrice(plan)}</p>
                  </div>
                  <div className="flex">
                    <Button id={`admin-plan-${plan._id}-edit`} variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(plan)} aria-label={`Edit ${plan.name}`}><Pencil className="h-4 w-4" /></Button>
                    <Button id={`admin-plan-${plan._id}-delete`} variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(plan)} aria-label={`Delete ${plan.name}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {plan.description && <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>}
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{feature}</li>)}
                </ul>
                {!plan.isActive && <Badge variant="outline" className="mt-4 w-fit">Inactive</Badge>}
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <PlanDialog open={isDialogOpen} plan={editing} onClose={() => setIsDialogOpen(false)} onSave={save} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>The plan is removed permanently. To hide it from customers but keep it, switch off &quot;Available to customers&quot; instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel id="admin-plan-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction id="admin-plan-delete-confirm" onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
