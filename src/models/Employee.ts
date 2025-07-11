
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IOrganization } from './Organization';

export type EmployeeRole = string;

export interface IEmployee extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: EmployeeRole;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  department?: string; // Added department
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
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite in HMR environments
const Employee: Model<IEmployee> = models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
