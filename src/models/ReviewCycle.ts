import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { CycleStatus, ReviewQuestion } from '@/lib/performance';

export interface IReviewCycle extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  dueAt: Date;
  status: CycleStatus;
  questions: ReviewQuestion[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReviewCycleSchema = new Schema<IReviewCycle>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, maxlength: 80 },
    dueAt: { type: Date, required: true },
    status: { type: String, default: 'draft' },
    questions: [{ _id: false, key: String, text: { type: String, maxlength: 200 }, kind: { type: String, enum: ['rating', 'text'] } }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  },
  { timestamps: true }
);

const ReviewCycle: Model<IReviewCycle> = models.ReviewCycle || mongoose.model<IReviewCycle>('ReviewCycle', ReviewCycleSchema);
export default ReviewCycle;
