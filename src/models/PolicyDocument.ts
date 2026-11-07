import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IPolicyDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  /** Goes up when the text changes, so people sign the new wording. */
  version: number;
  requiresAck: boolean;
  archived: boolean;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const PolicyDocumentSchema = new Schema<IPolicyDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 20000 },
    version: { type: Number, default: 1 },
    requiresAck: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  },
  { timestamps: true }
);

const PolicyDocument: Model<IPolicyDocument> = models.PolicyDocument || mongoose.model<IPolicyDocument>('PolicyDocument', PolicyDocumentSchema);
export default PolicyDocument;
