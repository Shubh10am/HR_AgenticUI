import mongoose, { Schema, Document, models, Model } from 'mongoose';

export type ThemePreference = 'system' | 'light' | 'dark';
export type DateFormatPreference = 'locale' | 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

/**
 * One person's display preferences. Keyed by the signed-in id, so it works for
 * employees and platform admins alike.
 */
export interface IUserPreference extends Document {
  userId: string;
  theme: ThemePreference;
  timeZone: string;
  dateFormat: DateFormatPreference;
  startPage: string;
  use24HourClock: boolean;
  newDeviceAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: { type: String, required: true, unique: true },
    theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
    timeZone: { type: String, default: '' },
    dateFormat: { type: String, enum: ['locale', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'], default: 'locale' },
    startPage: { type: String, default: '/dashboard' },
    use24HourClock: { type: Boolean, default: false },
    newDeviceAlerts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserPreference: Model<IUserPreference> =
  models.UserPreference || mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema);

export default UserPreference;
