import dbConnect from '@/lib/mongodb';
import UserPreference from '@/models/UserPreference';
import { DEFAULT_PREFERENCES, START_PAGES, type Preferences } from '@/lib/preferences';

export { DEFAULT_PREFERENCES, START_PAGES, type Preferences };

const THEMES = ['system', 'light', 'dark'];
const DATE_FORMATS = ['locale', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'];

function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** A person's preferences, with defaults for anything never saved. */
export async function getPreferences(userId: string): Promise<Preferences> {
  await dbConnect();
  const saved = await UserPreference.findOne({ userId }).lean();
  if (!saved) return { ...DEFAULT_PREFERENCES };
  return {
    theme: saved.theme,
    timeZone: saved.timeZone ?? '',
    dateFormat: saved.dateFormat,
    startPage: saved.startPage,
    use24HourClock: saved.use24HourClock,
    newDeviceAlerts: saved.newDeviceAlerts,
  };
}

/**
 * Validates a partial update against what the person may choose.
 *
 * @returns The fields to save, or an error message.
 */
export function parsePreferences(input: Record<string, unknown>, role: string): { update?: Partial<Preferences>; error?: string } {
  const update: Partial<Preferences> = {};
  if ('theme' in input) {
    if (!THEMES.includes(input.theme as string)) return { error: 'Choose system, light or dark.' };
    update.theme = input.theme as Preferences['theme'];
  }
  if ('timeZone' in input) {
    const zone = typeof input.timeZone === 'string' ? input.timeZone.trim() : '';
    if (zone && !isValidTimeZone(zone)) return { error: 'That time zone is not recognised.' };
    update.timeZone = zone;
  }
  if ('dateFormat' in input) {
    if (!DATE_FORMATS.includes(input.dateFormat as string)) return { error: 'Choose a supported date format.' };
    update.dateFormat = input.dateFormat as Preferences['dateFormat'];
  }
  if ('startPage' in input) {
    const isAdmin = role === 'Admin' || role === 'SuperAdmin';
    const page = START_PAGES.find((candidate) => candidate.path === input.startPage);
    if (!page || (page.adminOnly && !isAdmin)) return { error: 'Choose one of the listed start pages.' };
    update.startPage = page.path;
  }
  for (const key of ['use24HourClock', 'newDeviceAlerts'] as const) {
    if (key in input) {
      if (typeof input[key] !== 'boolean') return { error: `${key} must be true or false.` };
      update[key] = input[key] as boolean;
    }
  }
  return { update };
}

export async function savePreferences(userId: string, update: Partial<Preferences>): Promise<Preferences> {
  await dbConnect();
  await UserPreference.updateOne({ userId }, { $set: update, $setOnInsert: { userId } }, { upsert: true });
  return getPreferences(userId);
}
