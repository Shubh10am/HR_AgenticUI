import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { GoalStatus } from '@/lib/performance';

export interface IKeyResult {
  _id: mongoose.Types.ObjectId;
  title: string;
  start: number;
  target: number;
  current: number;
  unit: string;
}

export interface IGoal extends Document {
  organizationId: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  title: string;
  description: string;
  /** The goal this one supports, so goals roll up through the organisation. */
  parentId?: mongoose.Types.ObjectId | null;
  dueDate?: Date | null;
  status: GoalStatus;
  /** Used when the goal has no key results. */
  manualProgress: number;
  keyResults: IKeyResult[];
  createdAt: Date;
  updatedAt: Date;
}

const KeyResultSchema = new Schema<IKeyResult>({
  title: { type: String, required: true, maxlength: 140 },
  start: { type: Number, default: 0 },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  unit: { type: String, default: '', maxlength: 20 },
});

const GoalSchema = new Schema<IGoal>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', maxlength: 1000 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
    dueDate: { type: Date, default: null },
    status: { type: String, default: 'on-track' },
    manualProgress: { type: Number, default: 0, min: 0, max: 100 },
    keyResults: [KeyResultSchema],
  },
  { timestamps: true }
);

const Goal: Model<IGoal> = models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
export default Goal;
