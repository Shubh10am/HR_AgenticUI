
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IDemoRequest extends Document {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  companySize: string;
  message?: string;
}

const DemoRequestSchema: Schema<IDemoRequest> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
    },
    companySize: {
      type: String,
      required: [true, 'Company size is required.'],
    },
    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const DemoRequest: Model<IDemoRequest> =
  models.DemoRequest || mongoose.model<IDemoRequest>('DemoRequest', DemoRequestSchema);

export default DemoRequest;
