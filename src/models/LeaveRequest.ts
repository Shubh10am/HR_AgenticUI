
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IEmployee } from './Employee';
import type { IOrganization } from './Organization';

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Maternity' | 'Paternity' | 'Bereavement' | 'Other';

export interface ILeaveRequest extends Document {
  employeeId: mongoose.Types.ObjectId | IEmployee;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveRequestStatus;
  requestedAt: Date;
  // Optional fields for tracking approval process
  reviewedBy?: mongoose.Types.ObjectId | IEmployee;
  reviewedAt?: Date;
  reviewerComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema: Schema<ILeaveRequest> = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['Annual', 'Sick', 'Unpaid', 'Maternity', 'Paternity', 'Bereavement', 'Other'],
      required: [true, 'Leave type is required.'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required.'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required.'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required.'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    reviewedAt: {
      type: Date,
    },
    reviewerComments: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to help query leave requests by employee and date range efficiently
LeaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
// Index for status to quickly find pending requests, etc.
LeaveRequestSchema.index({ organizationId: 1, status: 1 });


const LeaveRequest: Model<ILeaveRequest> =
  models.LeaveRequest || mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);

export default LeaveRequest;
