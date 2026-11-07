import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IShift extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  start: string;
  end: string;
  graceMinutes: number;
  weeklyOff: number[];
  color: string;
  archived: boolean;
}

const ShiftSchema = new Schema<IShift>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, maxlength: 40 },
    start: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    end: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    graceMinutes: { type: Number, default: 15, min: 0, max: 120 },
    weeklyOff: { type: [Number], default: [0, 6] },
    color: { type: String, default: 'violet' },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Shift: Model<IShift> = models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);
export default Shift;
