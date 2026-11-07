/** Shared between the rewards API and UI. Safe to import on the client. */

/** Points a colleague earns each time they receive kudos. */
export const KUDOS_POINTS = 25;
/** Kudos a person can give per month that earn the recipient points (the kudos still post after that). */
export const KUDOS_POINTS_PER_GIVER_MONTHLY = 5;
export const MAX_AWARD = 1000;

export type RewardTxnKind = 'kudos' | 'award' | 'redeem' | 'refund';
export type RedemptionStatus = 'requested' | 'fulfilled' | 'declined';

export interface RewardItemView {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** Null when there is no limit. */
  stock: number | null;
  active: boolean;
}

export interface RewardTxnView {
  id: string;
  kind: RewardTxnKind;
  points: number;
  reason: string;
  status: RedemptionStatus | null;
  itemName: string | null;
  at: string;
}

export interface RedemptionView extends RewardTxnView {
  employee: { id: string; name: string; department: string };
}

export interface RewardsOverview {
  balance: number;
  earnedThisMonth: number;
  history: RewardTxnView[];
  items: RewardItemView[];
  leaders: { person: { id: string; name: string; department: string }; points: number }[];
}
