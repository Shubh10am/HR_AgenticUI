import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { TimesheetStatus } from '@/lib/timesheets';

/** One person's week of time, which they submit for approval. */
export interface ITimesheet extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  weekStart: string;
  status: TimesheetStatus;
  totalHours: number;
  submittedAt?: Date | null;
}

const TimesheetSchema = new Schema<ITimesheet>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    weekStart: { type: String, required: true },
    status: { type: String, default: 'draft' },
    totalHours: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
TimesheetSchema.index({ employee: 1, weekStart: 1 }, { unique: true });

const Timesheet: Model<ITimesheet> = models.Timesheet || mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);
export default Timesheet;
