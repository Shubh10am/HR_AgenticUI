import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { CourseCategory } from '@/lib/learning';

export interface ICourse extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: CourseCategory;
  url: string;
  durationMins: number;
  mandatory: boolean;
  dueInDays: number;
  active: boolean;
}

const CourseSchema = new Schema<ICourse>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    category: { type: String, required: true },
    url: { type: String, default: '', maxlength: 500 },
    durationMins: { type: Number, default: 30, min: 1 },
    mandatory: { type: Boolean, default: false },
    dueInDays: { type: Number, default: 30, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Course: Model<ICourse> = models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export default Course;
