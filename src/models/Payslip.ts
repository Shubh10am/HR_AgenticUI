import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { PayslipLine } from '@/lib/payroll';

export interface IPayslip extends Document {
  organizationId: mongoose.Types.ObjectId;
  run: mongoose.Types.ObjectId;
  month: string;
  employee: mongoose.Types.ObjectId;
  currency: string;
  lines: PayslipLine[];
  workingDays: number;
  unpaidDays: number;
  /** Snapshot of the person's work details on the payslip. */
  name: string;
  department: string;
  jobTitle: string;
}

const PayslipSchema = new Schema<IPayslip>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    run: { type: Schema.Types.ObjectId, ref: 'PayRun', required: true, index: true },
    month: { type: String, required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    currency: { type: String, default: 'INR' },
    lines: [{ _id: false, name: String, type: { type: String }, amount: Number }],
    workingDays: { type: Number, default: 0 },
    unpaidDays: { type: Number, default: 0 },
    name: String,
    department: String,
    jobTitle: String,
  },
  { timestamps: true }
);
PayslipSchema.index({ run: 1, employee: 1 }, { unique: true });

const Payslip: Model<IPayslip> = models.Payslip || mongoose.model<IPayslip>('Payslip', PayslipSchema);
export default Payslip;
