import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { EnrollmentStatus } from '@/lib/learning';

export interface IEnrollment extends Document {
  organizationId: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  assignedBy?: mongoose.Types.ObjectId | null;
  dueAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  certificateNo?: string | null;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    status: { type: String, default: 'assigned' },
    assignedBy: { type: Schema.Types.ObjectId, default: null },
    dueAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    certificateNo: { type: String, default: null },
  },
  { timestamps: true }
);
EnrollmentSchema.index({ course: 1, employee: 1 }, { unique: true });

const Enrollment: Model<IEnrollment> = models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export default Enrollment;
