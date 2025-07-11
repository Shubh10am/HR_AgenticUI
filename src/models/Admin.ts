import mongoose, { Schema, Document, models, Model } from 'mongoose';

export type AdminRole = 'SuperAdmin' | 'Admin';

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema<IAdmin> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Admin email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required.'],
    },
    role: {
      type: String,
      enum: ['SuperAdmin', 'Admin'],
      default: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Admin: Model<IAdmin> = models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
