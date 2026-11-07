import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { ExpenseStatus } from '@/lib/expenses';

export interface IExpense extends Document {
  organizationId: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  category: string;
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  spentOn: Date;
  status: ExpenseStatus;
  /** Stored inline and only sent to people who can see the claim. */
  receipt?: { name: string; type: string; data: string } | null;
  hasReceipt: boolean;
  paidAt?: Date | null;
  paidBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    category: { type: String, required: true },
    merchant: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, required: true, default: 'INR' },
    spentOn: { type: Date, required: true },
    status: { type: String, default: 'submitted', index: true },
    receipt: { type: new Schema({ name: String, type: String, data: String }, { _id: false }), default: null, select: false },
    hasReceipt: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    paidBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

const Expense: Model<IExpense> = models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
