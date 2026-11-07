import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IHoliday extends Document {
  organizationId: mongoose.Types.ObjectId;
  /** YYYY-MM-DD. */
  date: string;
  name: string;
  /** Optional holidays are listed but still count as working days. */
  optional: boolean;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    date: { type: String, required: true },
    name: { type: String, required: true, maxlength: 80 },
    optional: { type: Boolean, default: false },
  },
  { timestamps: true }
);
HolidaySchema.index({ organizationId: 1, date: 1 }, { unique: true });

const Holiday: Model<IHoliday> = models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
export default Holiday;
