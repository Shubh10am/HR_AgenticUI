import mongoose, { Schema, Document, models, Model } from 'mongoose';

export type AuditOutcome = 'success' | 'failure';

/**
 * One action a signed-in user performed. Only metadata is stored — who, what,
 * when and from where — never request bodies, so no record content (employee
 * details, messages, documents) ends up in the log.
 */
export interface IAuditLog extends Document {
  organizationId: mongoose.Types.ObjectId | null;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: string;
  method: string;
  path: string;
  statusCode: number;
  outcome: AuditOutcome;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

/** Entries are deleted automatically after this many days. */
export const AUDIT_RETENTION_DAYS = 365;

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    actorId: { type: String, required: true, index: true },
    actorName: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true },
    category: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    outcome: { type: String, enum: ['success', 'failure'], required: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: AUDIT_RETENTION_DAYS * 24 * 60 * 60 });

const AuditLog: Model<IAuditLog> = models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
