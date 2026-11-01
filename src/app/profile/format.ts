import type { Preferences } from '@/lib/preferences';

export type DisplayPrefs = Pick<Preferences, 'timeZone' | 'dateFormat' | 'use24HourClock'>;

/** A date and time in the person's chosen zone, date format and clock. */
export function formatDateTime(iso: string, prefs: DisplayPrefs, withTime = true): string {
  const date = new Date(iso);
  const timeZone = prefs.timeZone || undefined;
  const time = new Intl.DateTimeFormat(undefined, { timeZone, hour: 'numeric', minute: '2-digit', hour12: !prefs.use24HourClock }).format(date);

  let day: string;
  if (prefs.dateFormat === 'locale') {
    day = new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'medium' }).format(date);
  } else {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(date).map((part) => [part.type, part.value])
    );
    day = prefs.dateFormat.replace('dd', parts.day).replace('MM', parts.month).replace('yyyy', parts.year);
  }
  return withTime ? `${day}, ${time}` : day;
}

/** "5 min ago" style, falling back to the full date after a week. */
export function formatRelative(iso: string, prefs: DisplayPrefs): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour');
  if (seconds < 7 * 86400) return rtf.format(-Math.floor(seconds / 86400), 'day');
  return formatDateTime(iso, prefs);
}
