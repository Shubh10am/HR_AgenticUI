import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { LetterKey } from '@/lib/documents';

export interface ILetter extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  template: LetterKey;
  purpose: string;
  status: 'requested' | 'issued' | 'declined';
  body: string;
  issuedBy?: mongoose.Types.ObjectId | null;
  issuedAt?: Date | null;
  createdAt: Date;
}

const LetterSchema = new Schema<ILetter>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    template: { type: String, required: true },
    purpose: { type: String, default: '', maxlength: 200 },
    status: { type: String, default: 'requested' },
    body: { type: String, default: '', maxlength: 10000 },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    issuedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Letter: Model<ILetter> = models.Letter || mongoose.model<ILetter>('Letter', LetterSchema);
export default Letter;
