import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { LeaveTypePolicy } from '@/lib/leave';

export interface ILeavePolicy extends Document {
  organizationId: mongoose.Types.ObjectId;
  types: LeaveTypePolicy[];
  updatedBy?: mongoose.Types.ObjectId;
}

const LeavePolicySchema = new Schema<ILeavePolicy>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    types: [{ _id: false, type: { type: String }, annualDays: { type: Number, default: null }, carryForwardMax: { type: Number, default: 0 }, accrual: { type: String, default: 'upfront' }, enabled: { type: Boolean, default: true } }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

const LeavePolicy: Model<ILeavePolicy> = models.LeavePolicy || mongoose.model<ILeavePolicy>('LeavePolicy', LeavePolicySchema);
export default LeavePolicy;
