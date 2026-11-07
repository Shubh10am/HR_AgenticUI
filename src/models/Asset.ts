import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { AssetCategory, AssetHistoryView, AssetStatus } from '@/lib/assets';

export interface IAsset extends Document {
  organizationId: mongoose.Types.ObjectId;
  tag: string;
  name: string;
  category: AssetCategory;
  serial: string;
  purchasedOn?: Date | null;
  status: AssetStatus;
  assignee?: mongoose.Types.ObjectId | null;
  assignedAt?: Date | null;
  history: { action: AssetHistoryView['action']; employee?: mongoose.Types.ObjectId | null; by?: mongoose.Types.ObjectId | null; note?: string; at: Date }[];
}

const AssetSchema = new Schema<IAsset>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    tag: { type: String, required: true, trim: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true },
    serial: { type: String, default: '', trim: true, maxlength: 80 },
    purchasedOn: { type: Date, default: null },
    status: { type: String, default: 'available', index: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
    assignedAt: { type: Date, default: null },
    history: [{ _id: false, action: String, employee: { type: Schema.Types.ObjectId, default: null }, by: { type: Schema.Types.ObjectId, default: null }, note: { type: String, maxlength: 300 }, at: Date }],
  },
  { timestamps: true }
);
AssetSchema.index({ organizationId: 1, tag: 1 }, { unique: true });

const Asset: Model<IAsset> = models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
export default Asset;
