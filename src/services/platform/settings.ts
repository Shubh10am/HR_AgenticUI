import dbConnect from '@/lib/mongodb';
import PlatformSettings, { type IPlatformSettings } from '@/models/PlatformSettings';

export type PlatformSettingsData = Omit<IPlatformSettings, keyof import('mongoose').Document | 'key'>;

/** Settings are read on every authenticated request, so they are cached briefly in memory. */
const CACHE_MS = 15_000;
let cache: { value: PlatformSettingsData; at: number } | null = null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLACK_WEBHOOK = /^https:\/\/hooks\.slack\.com\/services\/[\w/]+$/;

function toData(doc: IPlatformSettings): PlatformSettingsData {
  const { _id, __v, key, ...rest } = doc.toObject ? doc.toObject() : (doc as any);
  return rest as PlatformSettingsData;
}

/** Current platform settings, creating the defaults on first use. */
export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  await dbConnect();
  const doc = await PlatformSettings.findOneAndUpdate({ key: 'global' }, { $setOnInsert: { key: 'global' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  cache = { value: toData(doc), at: Date.now() };
  return cache.value;
}

/** Same as getPlatformSettings, but never throws — a settings outage must not take the app down. */
export async function getPlatformSettingsSafe(): Promise<PlatformSettingsData | null> {
  try {
    return await getPlatformSettings();
  } catch (error) {
    console.error('[settings] Could not read platform settings:', error);
    return null;
  }
}

const TEXT_FIELDS = ['appName', 'supportEmail', 'maintenanceMessage', 'senderName', 'senderEmail', 'adminNotificationEmail', 'slackWebhookUrl'] as const;
const BOOLEAN_FIELDS = ['maintenanceMode', 'notifyOnNewOrganization', 'notifyOnContact', 'notifyOnDemoRequest'] as const;

/**
 * Validates and saves a partial settings update.
 *
 * @returns The saved settings, or a field → message map when validation fails.
 */
export async function updatePlatformSettings(input: Record<string, unknown>, updatedBy: string): Promise<{ settings?: PlatformSettingsData; errors?: Record<string, string> }> {
  const update: Record<string, string | boolean> = {};
  const errors: Record<string, string> = {};

  for (const field of TEXT_FIELDS) {
    if (input[field] === undefined) continue;
    if (typeof input[field] !== 'string') { errors[field] = 'Must be text.'; continue; }
    update[field] = (input[field] as string).trim().slice(0, field === 'maintenanceMessage' ? 500 : 200);
  }
  for (const field of BOOLEAN_FIELDS) {
    if (input[field] === undefined) continue;
    if (typeof input[field] !== 'boolean') { errors[field] = 'Must be on or off.'; continue; }
    update[field] = input[field] as boolean;
  }

  if ('appName' in update && !update.appName) errors.appName = 'Enter an application name.';
  if ('senderName' in update && !update.senderName) errors.senderName = 'Enter a sender name.';
  for (const field of ['supportEmail', 'senderEmail', 'adminNotificationEmail'] as const) {
    if (field in update && !EMAIL.test(update[field] as string)) errors[field] = 'Enter a valid email address.';
  }
  if (update.slackWebhookUrl && !SLACK_WEBHOOK.test(update.slackWebhookUrl as string)) {
    errors.slackWebhookUrl = 'Use a Slack incoming webhook URL (https://hooks.slack.com/services/…).';
  }
  if (Object.keys(errors).length) return { errors };

  await dbConnect();
  const doc = await PlatformSettings.findOneAndUpdate({ key: 'global' }, { $set: { ...update, updatedBy } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  cache = { value: toData(doc), at: Date.now() };
  return { settings: cache.value };
}
