import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { RedemptionStatus, RewardTxnKind } from '@/lib/rewards';

/** One line in a person's points ledger. The balance is the sum of their lines. */
export interface IRewardTxn extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  kind: RewardTxnKind;
  points: number;
  reason: string;
  /** Who caused the line: the kudos giver, the awarding HR person, or the redeemer. */
  by?: mongoose.Types.ObjectId | null;
  post?: mongoose.Types.ObjectId | null;
  item?: mongoose.Types.ObjectId | null;
  itemName?: string | null;
  status?: RedemptionStatus | null;
  createdAt: Date;
}

const RewardTxnSchema = new Schema<IRewardTxn>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    kind: { type: String, required: true },
    points: { type: Number, required: true },
    reason: { type: String, default: '', maxlength: 200 },
    by: { type: Schema.Types.ObjectId, default: null },
    post: { type: Schema.Types.ObjectId, default: null },
    item: { type: Schema.Types.ObjectId, default: null },
    itemName: { type: String, default: null },
    status: { type: String, default: null, index: true },
  },
  { timestamps: true }
);
RewardTxnSchema.index({ organizationId: 1, createdAt: -1 });
// One kudos post pays out once.
RewardTxnSchema.index({ post: 1 }, { unique: true, partialFilterExpression: { kind: 'kudos' } });

const RewardTxn: Model<IRewardTxn> = models.RewardTxn || mongoose.model<IRewardTxn>('RewardTxn', RewardTxnSchema);
export default RewardTxn;
