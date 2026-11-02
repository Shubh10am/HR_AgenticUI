

import mongoose, { Schema, Document, models, Model } from 'mongoose';
import './Organization'; // Ensure Organization model is registered

export type EmployeeRole = 'Admin' | 'HR' | 'Manager' | 'Employee';

export interface IEmployee extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: EmployeeRole;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  department?: string; // Added department
  /** Job title shown on the org chart, e.g. "Engineering Manager". */
  jobTitle?: string;
  /** Who this person reports to; unset for the top of the org chart. */
  managerId?: mongoose.Types.ObjectId | null;
  magicLinkToken?: string;
  magicLinkExpires?: Date;
  /** SHA-256 of a one-time set/reset-password token; the raw token only ever goes in the email. */
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  /** When the person last chose their own password; unset while an invite is pending. */
  passwordSetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema<IEmployee> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Employee name is required.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Employee email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      // Basic email validation regex (consider a more robust one or a library)
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required.'],
    },
    role: {
      type: String,
      enum: ['Admin', 'HR', 'Manager', 'Employee'],
      required: true,
      trim: true,
      default: 'Employee',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    department: { // Added department field
      type: String,
      trim: true,
    },
    jobTitle: { type: String, trim: true, maxlength: 80 },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
    magicLinkToken: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but unique if set
    },
    magicLinkExpires: {
      type: Date,
    },
    passwordResetToken: { type: String, index: true, sparse: true },
    passwordResetExpires: { type: Date },
    passwordSetAt: { type: Date },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite in HMR environments
const Employee: Model<IEmployee> = models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
