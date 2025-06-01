
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IEmployee } from './Employee';
import type { IOrganization } from './Organization';

// A more specific status based on clock-in/out events.
// More complex statuses like 'Absent' or 'On Leave' might be determined
// by querying related data (e.g., LeaveRequests or lack of records on a workday).
export type AttendanceStatus = 'Present' | 'Late' | 'EarlyDeparture';

export interface IAttendanceRecord extends Document {
  employeeId: mongoose.Types.ObjectId | IEmployee;
  organizationId: mongoose.Types.ObjectId | IOrganization;
  date: Date; // Stores the specific date of the record, normalized to start of day
  clockInTime: Date;
  clockOutTime?: Date;
  hoursWorked?: number; // in minutes, calculated on clock-out
  status?: AttendanceStatus; // Can be set based on company policy (e.g., if clockInTime > expectedStartTime)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema: Schema<IAttendanceRecord> = new Schema(
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
    date: {
      // Represents the calendar date for which this record applies (e.g., 2024-07-25T00:00:00.000Z)
      // This helps in querying records for a specific day regardless of exact clock-in/out times.
      type: Date,
      required: true,
      index: true,
    },
    clockInTime: {
      type: Date,
      required: true,
    },
    clockOutTime: {
      type: Date,
    },
    hoursWorked: { // Stored in minutes
      type: Number,
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'EarlyDeparture'], // Basic statuses derived from clocking activity
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure that an employee can only have one clock-in record per date.
// This doesn't prevent multiple clock-in/out entries if your system allows (e.g., for breaks),
// but for a simple daily record, this unique index is useful.
// If multiple entries per day are needed, this index should be removed or adjusted.
AttendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });


const AttendanceRecord: Model<IAttendanceRecord> =
  models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);

export default AttendanceRecord;
