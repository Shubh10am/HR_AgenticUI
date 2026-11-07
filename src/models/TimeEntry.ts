import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface ITimeEntry extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  /** YYYY-MM-DD. */
  date: string;
  hours: number;
  note: string;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: String, required: true },
    hours: { type: Number, required: true, min: 0, max: 24 },
    note: { type: String, default: '', maxlength: 200 },
  },
  { timestamps: true }
);
TimeEntrySchema.index({ organizationId: 1, employee: 1, date: 1 });

const TimeEntry: Model<ITimeEntry> = models.TimeEntry || mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);
export default TimeEntry;
