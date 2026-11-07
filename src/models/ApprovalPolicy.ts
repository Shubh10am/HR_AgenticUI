import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { ApprovalKind, PolicyStep } from '@/lib/approvals';

export interface IApprovalPolicy extends Document {
  organizationId: mongoose.Types.ObjectId;
  kind: ApprovalKind;
  steps: PolicyStep[];
  updatedBy?: mongoose.Types.ObjectId;
}

const ApprovalPolicySchema = new Schema<IApprovalPolicy>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    kind: { type: String, required: true },
    steps: [{ _id: false, approver: { type: String, enum: ['manager', 'HR', 'Admin'], required: true }, minAmount: { type: Number, default: null } }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);
ApprovalPolicySchema.index({ organizationId: 1, kind: 1 }, { unique: true });

const ApprovalPolicy: Model<IApprovalPolicy> = models.ApprovalPolicy || mongoose.model<IApprovalPolicy>('ApprovalPolicy', ApprovalPolicySchema);
export default ApprovalPolicy;
