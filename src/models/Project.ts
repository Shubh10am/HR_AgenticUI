import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IProject extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  client: string;
  code: string;
  billable: boolean;
  active: boolean;
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, maxlength: 80 },
    client: { type: String, default: '', maxlength: 80 },
    code: { type: String, default: '', maxlength: 20 },
    billable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Project: Model<IProject> = models.Project || mongoose.model<IProject>('Project', ProjectSchema);
export default Project;
