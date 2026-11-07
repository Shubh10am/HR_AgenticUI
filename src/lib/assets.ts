/** Shared between the assets API and UI. Safe to import on the client. */
export const ASSET_CATEGORIES = ['Laptop', 'Phone', 'Monitor', 'ID card', 'Accessory', 'Other'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];
export type AssetStatus = 'available' | 'assigned' | 'repair' | 'retired';

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  available: 'In stock',
  assigned: 'Assigned',
  repair: 'In repair',
  retired: 'Retired',
};

export interface AssetHistoryView {
  action: 'added' | 'assigned' | 'returned' | 'repair' | 'retired' | 'restocked';
  employeeName: string | null;
  byName: string | null;
  note: string;
  at: string;
}

export interface AssetView {
  id: string;
  tag: string;
  name: string;
  category: AssetCategory;
  serial: string;
  purchasedOn: string | null;
  status: AssetStatus;
  assignee: { id: string; name: string; department: string } | null;
  assignedAt: string | null;
  history: AssetHistoryView[];
}
