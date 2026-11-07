import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { PayComponent } from '@/lib/payroll';

/** One person's monthly pay, as fixed components. Only HR and admins (and the person) can read it. */
export interface IPayStructure extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  currency: string;
  components: PayComponent[];
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const PayStructureSchema = new Schema<IPayStructure>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    currency: { type: String, default: 'INR', maxlength: 3 },
    components: [{ _id: false, name: { type: String, maxlength: 60 }, type: { type: String }, amount: Number }],
    updatedBy: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

const PayStructure: Model<IPayStructure> = models.PayStructure || mongoose.model<IPayStructure>('PayStructure', PayStructureSchema);
export default PayStructure;
