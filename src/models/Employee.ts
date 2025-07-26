

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
  magicLinkToken?: string;
  magicLinkExpires?: Date;
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
    magicLinkToken: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but unique if set
    },
    magicLinkExpires: {
      type: Date,
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model overwrite in HMR environments
const Employee: Model<IEmployee> = models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
