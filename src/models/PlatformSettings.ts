import mongoose, { Schema, Document, models, Model } from 'mongoose';

/** Platform-wide configuration edited from Admin → System Settings. There is one document, keyed "global". */
export interface IPlatformSettings extends Document {
  key: 'global';
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  senderName: string;
  senderEmail: string;
  adminNotificationEmail: string;
  notifyOnNewOrganization: boolean;
  notifyOnContact: boolean;
  notifyOnDemoRequest: boolean;
  slackWebhookUrl: string;
  updatedBy: string;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, enum: ['global'], default: 'global', unique: true },
    appName: { type: String, default: 'HR Streamline AI' },
    supportEmail: { type: String, default: 'support@agentic-hr.in' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'We are carrying out scheduled maintenance and will be back shortly.' },
    senderName: { type: String, default: 'HR Streamline AI' },
    senderEmail: { type: String, default: 'noreply@agentic-hr.in' },
    adminNotificationEmail: { type: String, default: 'support@agentic-hr.in' },
    notifyOnNewOrganization: { type: Boolean, default: true },
    notifyOnContact: { type: Boolean, default: true },
    notifyOnDemoRequest: { type: Boolean, default: true },
    slackWebhookUrl: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const PlatformSettings: Model<IPlatformSettings> =
  models.PlatformSettings || mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);

export default PlatformSettings;
