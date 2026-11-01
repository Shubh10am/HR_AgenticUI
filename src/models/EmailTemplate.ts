import mongoose, { Schema, Document, models, Model } from 'mongoose';

/** An admin's edit of a system email. Templates with no document use the built-in default. */
export interface IEmailTemplate extends Document {
  key: string;
  subject: string;
  body: string;
  updatedBy: string;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: { type: String, required: true, unique: true },
    subject: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 5000 },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const EmailTemplate: Model<IEmailTemplate> = models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export default EmailTemplate;
