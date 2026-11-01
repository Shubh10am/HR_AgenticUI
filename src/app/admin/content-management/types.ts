import type { BillingInterval } from '@/models/SubscriptionPlan';

export interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  isActive: boolean;
  isHighlighted: boolean;
  sortOrder: number;
}

export type PlanDraft = Omit<Plan, '_id'>;

export const EMPTY_PLAN: PlanDraft = { name: '', description: '', price: 0, currency: 'USD', interval: 'month', features: [], isActive: true, isHighlighted: false, sortOrder: 0 };

export function formatPrice(plan: Pick<Plan, 'price' | 'currency' | 'interval'>): string {
  if (plan.interval === 'custom') return 'Custom pricing';
  if (plan.price === 0) return 'Free';
  const amount = new Intl.NumberFormat('en', { style: 'currency', currency: plan.currency, maximumFractionDigits: plan.price % 1 ? 2 : 0 }).format(plan.price);
  return `${amount} / ${plan.interval}`;
}

export interface EmailTemplateItem {
  key: string;
  name: string;
  description: string;
  variables: string[];
  subject: string;
  body: string;
  defaultSubject: string;
  defaultBody: string;
  isCustomized: boolean;
  updatedAt: string | null;
}
