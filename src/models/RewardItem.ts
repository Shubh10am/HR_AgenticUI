import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IRewardItem extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  cost: number;
  stock: number | null;
  active: boolean;
}

const RewardItemSchema = new Schema<IRewardItem>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 300 },
    cost: { type: Number, required: true, min: 1 },
    stock: { type: Number, default: null, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const RewardItem: Model<IRewardItem> = models.RewardItem || mongoose.model<IRewardItem>('RewardItem', RewardItemSchema);
export default RewardItem;
