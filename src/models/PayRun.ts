import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { PayRunStatus } from '@/lib/payroll';

export interface IPayRun extends Document {
  organizationId: mongoose.Types.ObjectId;
  month: string;
  status: PayRunStatus;
  currency: string;
  createdBy: mongoose.Types.ObjectId;
  publishedAt?: Date | null;
  createdAt: Date;
}

const PayRunSchema = new Schema<IPayRun>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    month: { type: String, required: true },
    status: { type: String, default: 'draft' },
    currency: { type: String, default: 'INR' },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
PayRunSchema.index({ organizationId: 1, month: 1 }, { unique: true });

const PayRun: Model<IPayRun> = models.PayRun || mongoose.model<IPayRun>('PayRun', PayRunSchema);
export default PayRun;
