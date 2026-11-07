import mongoose, { Schema, Document, models, Model } from 'mongoose';

/** A person's typed-name signature on one version of a policy. */
export interface IPolicyAcknowledgement extends Document {
  organizationId: mongoose.Types.ObjectId;
  document: mongoose.Types.ObjectId;
  version: number;
  employee: mongoose.Types.ObjectId;
  signedName: string;
  createdAt: Date;
}

const PolicyAcknowledgementSchema = new Schema<IPolicyAcknowledgement>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    document: { type: Schema.Types.ObjectId, ref: 'PolicyDocument', required: true },
    version: { type: Number, required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    signedName: { type: String, required: true, maxlength: 80 },
  },
  { timestamps: true }
);
PolicyAcknowledgementSchema.index({ document: 1, version: 1, employee: 1 }, { unique: true });

const PolicyAcknowledgement: Model<IPolicyAcknowledgement> =
  models.PolicyAcknowledgement || mongoose.model<IPolicyAcknowledgement>('PolicyAcknowledgement', PolicyAcknowledgementSchema);
export default PolicyAcknowledgement;
