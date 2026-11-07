import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { OneOnOneStatus } from '@/lib/one-on-ones';

export interface IOneOnOne extends Document {
  organizationId: mongoose.Types.ObjectId;
  manager: mongoose.Types.ObjectId;
  report: mongoose.Types.ObjectId;
  scheduledFor: Date;
  status: OneOnOneStatus;
  agenda: { _id: mongoose.Types.ObjectId; text: string; addedBy: mongoose.Types.ObjectId; done: boolean }[];
  sharedNotes: string;
  /** Each side's private notes. Never returned to the other person. */
  managerNotes: string;
  reportNotes: string;
  actions: { _id: mongoose.Types.ObjectId; text: string; owner: mongoose.Types.ObjectId; done: boolean }[];
}

const OneOnOneSchema = new Schema<IOneOnOne>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    manager: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    report: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    scheduledFor: { type: Date, required: true },
    status: { type: String, default: 'scheduled' },
    agenda: [{ text: { type: String, maxlength: 200 }, addedBy: Schema.Types.ObjectId, done: { type: Boolean, default: false } }],
    sharedNotes: { type: String, default: '', maxlength: 5000 },
    managerNotes: { type: String, default: '', maxlength: 5000, select: false },
    reportNotes: { type: String, default: '', maxlength: 5000, select: false },
    actions: [{ text: { type: String, maxlength: 200 }, owner: Schema.Types.ObjectId, done: { type: Boolean, default: false } }],
  },
  { timestamps: true }
);

const OneOnOne: Model<IOneOnOne> = models.OneOnOne || mongoose.model<IOneOnOne>('OneOnOne', OneOnOneSchema);
export default OneOnOne;
