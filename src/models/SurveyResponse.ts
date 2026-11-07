import { randomUUID } from 'crypto';
import mongoose, { Schema, Document, models, Model } from 'mongoose';

/**
 * One anonymous set of answers. It holds no employee reference and no timestamp — only the
 * department (used for breakdowns of at least five people) — so it cannot be traced to a person.
 */
export interface ISurveyResponse extends Omit<Document, '_id'> {
  _id: string;
  survey: mongoose.Types.ObjectId;
  department: string;
  answers: { key: string; value: number | string }[];
}

const SurveyResponseSchema = new Schema<ISurveyResponse>(
  {
    // A random id: an ObjectId would carry the time it was written.
    _id: { type: String, default: () => randomUUID() },
    survey: { type: Schema.Types.ObjectId, ref: 'Survey', required: true, index: true },
    department: { type: String, default: '' },
    answers: [{ _id: false, key: String, value: Schema.Types.Mixed }],
  },
  { timestamps: false, versionKey: false }
);

const SurveyResponse: Model<ISurveyResponse> = models.SurveyResponse || mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
export default SurveyResponse;
