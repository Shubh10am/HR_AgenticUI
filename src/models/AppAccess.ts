import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { AccessStatus, AccessView } from '@/lib/apps';

export interface IAppAccess extends Document {
  organizationId: mongoose.Types.ObjectId;
  app: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  status: AccessStatus;
  reason: string;
  source: AccessView['source'];
  history: { status: AccessStatus; by?: mongoose.Types.ObjectId | null; at: Date }[];
  updatedAt: Date;
}

const AppAccessSchema = new Schema<IAppAccess>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    app: { type: Schema.Types.ObjectId, ref: 'App', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    status: { type: String, required: true, index: true },
    reason: { type: String, default: '', maxlength: 300 },
    source: { type: String, default: 'request' },
    history: [{ _id: false, status: String, by: { type: Schema.Types.ObjectId, default: null }, at: Date }],
  },
  { timestamps: true }
);
AppAccessSchema.index({ app: 1, employee: 1 });

const AppAccess: Model<IAppAccess> = models.AppAccess || mongoose.model<IAppAccess>('AppAccess', AppAccessSchema);
export default AppAccess;
