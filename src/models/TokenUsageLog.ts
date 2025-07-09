import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IOrganization } from './Organization';
import type { IEmployee } from './Employee';

export interface ITokenUsageLog extends Document {
  organizationId: mongoose.Types.ObjectId | IOrganization;
  employeeId: mongoose.Types.ObjectId | IEmployee;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

const TokenUsageLogSchema: Schema<ITokenUsageLog> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    feature: {
      type: String,
      required: true,
    },
    inputTokens: {
      type: Number,
      required: true,
    },
    outputTokens: {
      type: Number,
      required: true,
    },
    totalTokens: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt
  }
);

const TokenUsageLog: Model<ITokenUsageLog> =
  models.TokenUsageLog || mongoose.model<ITokenUsageLog>('TokenUsageLog', TokenUsageLogSchema);

export default TokenUsageLog;
