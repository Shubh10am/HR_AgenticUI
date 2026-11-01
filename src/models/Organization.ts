
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export type OrganizationStatus = 'Active' | 'Hold' | 'Suspended';

export interface IOrganization extends Document {
  name: string;
  emailDomain: string; // e.g., "example.com"
  status: OrganizationStatus;
  encryptedGoogleApiKey?: string; // Stores iv:authTag:encryptedKey
  /** The organization's own AI provider. Absent means the platform's Gemini key (or the legacy Google key above). */
  aiConfig?: {
    provider: string;
    model: string;
    baseURL?: string;
    encryptedApiKey?: string;
    updatedBy?: string;
    updatedAt?: Date;
  };
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
      enum: ['Active', 'Hold', 'Suspended'],
      default: 'Active',
      required: true,
    },
    encryptedGoogleApiKey: {
      type: String,
      required: false, // Optional field
    },
    aiConfig: {
      type: new Schema(
        {
          provider: { type: String, required: true },
          model: { type: String, required: true, trim: true, maxlength: 120 },
          baseURL: { type: String, trim: true },
          encryptedApiKey: { type: String },
          updatedBy: { type: String },
          updatedAt: { type: Date },
        },
        { _id: false }
      ),
      required: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite in HMR environments
const Organization: Model<IOrganization> = models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
