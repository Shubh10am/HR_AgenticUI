import mongoose, { Schema, Document, models, Model } from 'mongoose';

export type BillingInterval = 'month' | 'year' | 'custom';

export interface ISubscriptionPlan extends Document {
  name: string;
  description: string;
  /** Price in whole currency units; ignored when the interval is "custom". */
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  isActive: boolean;
  isHighlighted: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, default: '', maxlength: 300 },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD', maxlength: 3 },
    interval: { type: String, enum: ['month', 'year', 'custom'], default: 'month' },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    isHighlighted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SubscriptionPlan: Model<ISubscriptionPlan> =
  models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);

export default SubscriptionPlan;
