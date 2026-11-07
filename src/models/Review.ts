import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { ReviewType } from '@/lib/performance';

export interface IReview extends Document {
  organizationId: mongoose.Types.ObjectId;
  cycle: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  type: ReviewType;
  status: 'pending' | 'submitted';
  answers: { key: string; rating?: number | null; text?: string }[];
  submittedAt?: Date | null;
}

const ReviewSchema = new Schema<IReview>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    cycle: { type: Schema.Types.ObjectId, ref: 'ReviewCycle', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    reviewer: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    type: { type: String, required: true },
    status: { type: String, default: 'pending' },
    answers: [{ _id: false, key: String, rating: { type: Number, min: 1, max: 5, default: null }, text: { type: String, maxlength: 4000, default: '' } }],
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
ReviewSchema.index({ cycle: 1, subject: 1, type: 1 }, { unique: true });

const Review: Model<IReview> = models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
