import dbConnect from '@/lib/mongodb';
import SubscriptionPlan, { type BillingInterval } from '@/models/SubscriptionPlan';

const INTERVALS: BillingInterval[] = ['month', 'year', 'custom'];
const MAX_FEATURES = 20;

export interface PlanInput {
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

/** Validates a plan from the admin form. */
export function parsePlan(input: Record<string, unknown>): { plan?: PlanInput; error?: string } {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 60) return { error: 'Enter a plan name of up to 60 characters.' };
  const interval = INTERVALS.includes(input.interval as BillingInterval) ? (input.interval as BillingInterval) : null;
  if (!interval) return { error: 'Choose monthly, yearly or custom pricing.' };
  const price = interval === 'custom' ? 0 : Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) return { error: 'Enter a price of 0 or more.' };
  const currency = typeof input.currency === 'string' && /^[A-Z]{3}$/.test(input.currency) ? input.currency : 'USD';
  const features = Array.isArray(input.features)
    ? input.features.filter((feature): feature is string => typeof feature === 'string').map((feature) => feature.trim().slice(0, 120)).filter(Boolean).slice(0, MAX_FEATURES)
    : [];
  return {
    plan: {
      name,
      description: typeof input.description === 'string' ? input.description.trim().slice(0, 300) : '',
      price: Math.round(price * 100) / 100,
      currency,
      interval,
      features,
      isActive: input.isActive !== false,
      isHighlighted: input.isHighlighted === true,
      sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    },
  };
}

export async function listPlans(onlyActive = false) {
  await dbConnect();
  const plans = await SubscriptionPlan.find(onlyActive ? { isActive: true } : {}).sort({ sortOrder: 1, price: 1 }).lean();
  return plans.map((plan) => ({ ...plan, _id: String(plan._id) }));
}
