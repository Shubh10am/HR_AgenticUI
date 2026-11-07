import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { ChecklistOwner, ExitReason, OffboardingStatus } from '@/lib/offboarding';

export interface IChecklistItem {
  key: string;
  label: string;
  owner: ChecklistOwner;
  done: boolean;
  doneBy?: mongoose.Types.ObjectId | null;
  doneAt?: Date | null;
}

export interface IOffboarding extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  initiatedBy: mongoose.Types.ObjectId;
  reason: ExitReason;
  note: string;
  noticeGivenOn: Date;
  lastWorkingDay: Date;
  status: OffboardingStatus;
  checklist: IChecklistItem[];
  /** Confidential: HR and admins only. */
  exitInterview?: { answers: { key: string; answer: string }[]; submittedAt: Date } | null;
  createdAt: Date;
  updatedAt: Date;
}

const OffboardingSchema = new Schema<IOffboarding>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    reason: { type: String, required: true },
    note: { type: String, default: '', maxlength: 1000 },
    noticeGivenOn: { type: Date, required: true },
    lastWorkingDay: { type: Date, required: true },
    status: { type: String, default: 'pending-approval', index: true },
    checklist: [
      {
        _id: false,
        key: String,
        label: String,
        owner: String,
        done: { type: Boolean, default: false },
        doneBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
        doneAt: { type: Date, default: null },
      },
    ],
    exitInterview: {
      type: new Schema({ answers: [{ _id: false, key: String, answer: { type: String, maxlength: 2000 } }], submittedAt: Date }, { _id: false }),
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

const Offboarding: Model<IOffboarding> = models.Offboarding || mongoose.model<IOffboarding>('Offboarding', OffboardingSchema);
export default Offboarding;
