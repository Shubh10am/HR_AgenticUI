import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { ApprovalKind, ApprovalStatus, ApproverType, StepStatus } from '@/lib/approvals';

export interface IApprovalStep {
  approver: ApproverType;
  /** The manager, for a manager step. */
  assignee?: mongoose.Types.ObjectId | null;
  status: StepStatus;
  decidedBy?: mongoose.Types.ObjectId | null;
  decidedAt?: Date | null;
  comment?: string;
}

export interface IApprovalRequest extends Document {
  organizationId: mongoose.Types.ObjectId;
  kind: ApprovalKind;
  /** The record being approved (an expense, an offboarding case…). */
  subjectId: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId;
  title: string;
  summary: string;
  amount?: number | null;
  currency?: string | null;
  steps: IApprovalStep[];
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    kind: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
    requester: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    title: { type: String, required: true, maxlength: 140 },
    summary: { type: String, default: '', maxlength: 500 },
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    steps: [
      {
        _id: false,
        approver: { type: String, required: true },
        assignee: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
        status: { type: String, required: true },
        decidedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
        decidedAt: { type: Date, default: null },
        comment: { type: String, default: '', maxlength: 500 },
      },
    ],
    status: { type: String, default: 'pending', index: true },
  },
  { timestamps: true }
);

const ApprovalRequest: Model<IApprovalRequest> = models.ApprovalRequest || mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);
export default ApprovalRequest;
