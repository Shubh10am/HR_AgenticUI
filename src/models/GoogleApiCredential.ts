
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IEmployee } from './Employee';
import type { IOrganization } from './Organization';

export interface IGoogleApiCredential extends Document {
  employeeId: mongoose.Types.ObjectId | IEmployee;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  accessToken: string;
  refreshToken?: string;
  scope: string;
  tokenType: string;
  expiryDate: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleApiCredentialSchema: Schema<IGoogleApiCredential> = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true, // Each employee can only have one set of credentials
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    scope: {
      type: String,
      required: true,
    },
    tokenType: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const GoogleApiCredential: Model<IGoogleApiCredential> =
  models.GoogleApiCredential || mongoose.model<IGoogleApiCredential>('GoogleApiCredential', GoogleApiCredentialSchema);

export default GoogleApiCredential;
