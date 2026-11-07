import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { AppCategory } from '@/lib/apps';

export interface IApp extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  category: AppCategory;
  description: string;
  defaultFor: string[];
  requiresApproval: boolean;
  active: boolean;
}

const AppSchema = new Schema<IApp>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    url: { type: String, default: '', maxlength: 300 },
    category: { type: String, default: 'Other' },
    description: { type: String, default: '', maxlength: 300 },
    defaultFor: [{ type: String, maxlength: 60 }],
    requiresApproval: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const App: Model<IApp> = models.App || mongoose.model<IApp>('App', AppSchema);
export default App;
