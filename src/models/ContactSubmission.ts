
import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const ContactSubmissionSchema: Schema<IContactSubmission> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
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
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required.'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ContactSubmission: Model<IContactSubmission> =
  models.ContactSubmission || mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);

export default ContactSubmission;
