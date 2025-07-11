import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IEmployee } from './Employee';
import type { IOrganization } from './Organization';

export type TicketStatus = 'Open' | 'In Progress' | 'Closed' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface ISupportTicket extends Document {
  organizationId: mongoose.Types.ObjectId | IOrganization;
  submittedBy: mongoose.Types.ObjectId | IEmployee;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: mongoose.Types.ObjectId | IEmployee;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema: Schema<ISupportTicket> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Closed', 'Resolved'],
      default: 'Open',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    resolution: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const SupportTicket: Model<ISupportTicket> =
  models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
