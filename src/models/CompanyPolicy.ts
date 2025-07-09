
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IOrganization } from './Organization';
import type { IEmployee } from './Employee';

export type PolicyType = 'attendance' | 'leave' | 'codeOfConduct';

export interface ICompanyPolicy extends Document {
  organizationId: mongoose.Types.ObjectId | IOrganization;
  policyType: PolicyType;
  content: string;
  updatedBy: mongoose.Types.ObjectId | IEmployee;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyPolicySchema: Schema<ICompanyPolicy> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    policyType: {
      type: String,
      enum: ['attendance', 'leave', 'codeOfConduct'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Ensure that each organization can only have one of each policy type.
CompanyPolicySchema.index({ organizationId: 1, policyType: 1 }, { unique: true });

const CompanyPolicy: Model<ICompanyPolicy> =
  models.CompanyPolicy || mongoose.model<ICompanyPolicy>('CompanyPolicy', CompanyPolicySchema);

export default CompanyPolicy;
