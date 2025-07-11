
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export type OrganizationStatus = 'Active' | 'Suspended' | 'Inactive';

export interface IOrganization extends Document {
  name: string;
  emailDomain: string; // e.g., "example.com"
  status: OrganizationStatus;
  encryptedGoogleApiKey?: string; // Stores iv:authTag:encryptedKey
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema<IOrganization> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required.'],
      trim: true,
    },
    emailDomain: {
      type: String,
      required: [true, 'Organization email domain is required.'],
      trim: true,
      lowercase: true,
      // Consider adding unique: true if you want emailDomain to be unique
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Inactive'],
      default: 'Active',
      required: true,
    },
    encryptedGoogleApiKey: {
      type: String,
      required: false, // Optional field
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite in HMR environments
const Organization: Model<IOrganization> = models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
