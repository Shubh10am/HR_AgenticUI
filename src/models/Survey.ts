import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { SurveyQuestion, SurveyStatus } from '@/lib/surveys';

export interface ISurvey extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  status: SurveyStatus;
  closesAt?: Date | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SurveySchema = new Schema<ISurvey>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 500 },
    questions: [{ _id: false, key: String, kind: String, text: { type: String, maxlength: 200 }, options: [String] }],
    status: { type: String, default: 'draft' },
    closesAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  },
  { timestamps: true }
);

const Survey: Model<ISurvey> = models.Survey || mongoose.model<ISurvey>('Survey', SurveySchema);
export default Survey;
