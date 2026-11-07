import { randomUUID } from 'crypto';
import mongoose, { Schema, Document, models, Model } from 'mongoose';

/** Records only that someone answered, so they answer once. Kept separate from their answers. */
export interface ISurveyParticipation extends Omit<Document, '_id'> {
  _id: string;
  survey: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
}

const SurveyParticipationSchema = new Schema<ISurveyParticipation>(
  {
    // A random id: an ObjectId would carry the time it was written.
    _id: { type: String, default: () => randomUUID() },
    survey: { type: Schema.Types.ObjectId, ref: 'Survey', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  },
  { timestamps: false, versionKey: false }
);
SurveyParticipationSchema.index({ survey: 1, employee: 1 }, { unique: true });

const SurveyParticipation: Model<ISurveyParticipation> =
  models.SurveyParticipation || mongoose.model<ISurveyParticipation>('SurveyParticipation', SurveyParticipationSchema);
export default SurveyParticipation;
