import mongoose, { Schema, Document, models, Model } from 'mongoose';

/** Puts a person on a shift from a day onwards (until `to`, or open-ended). The latest start wins. */
export interface IShiftAssignment extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  shift: mongoose.Types.ObjectId;
  from: string;
  to?: string | null;
  createdAt: Date;
}

const ShiftAssignmentSchema = new Schema<IShiftAssignment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    from: { type: String, required: true },
    to: { type: String, default: null },
  },
  { timestamps: true }
);

const ShiftAssignment: Model<IShiftAssignment> = models.ShiftAssignment || mongoose.model<IShiftAssignment>('ShiftAssignment', ShiftAssignmentSchema);
export default ShiftAssignment;
