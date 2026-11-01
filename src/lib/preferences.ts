// Client-safe: shared by the profile page and the preferences service.

export interface Preferences {
  theme: 'system' | 'light' | 'dark';
  /** IANA zone; empty means "use the browser's". */
  timeZone: string;
  dateFormat: 'locale' | 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  startPage: string;
  use24HourClock: boolean;
  newDeviceAlerts: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  timeZone: '',
  dateFormat: 'locale',
  startPage: '/dashboard',
  use24HourClock: false,
  newDeviceAlerts: true,
};

/** Pages a person may land on after signing in. Admin-only pages are filtered by role. */
export const START_PAGES: { path: string; label: string; adminOnly?: boolean }[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/attendance-reporting', label: 'My Attendance' },
  { path: '/gmail-inbox', label: 'Gmail Inbox' },
  { path: '/community', label: 'Community' },
  { path: '/knowledge-base', label: 'Knowledge Base' },
  { path: '/manage-employees', label: 'Manage Employees', adminOnly: true },
];


const GUEST_PREFERENCES_KEY = 'guestPreferences';

/** Guest preferences live in this browser only. */
export function loadGuestPreferences(): Preferences {
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(GUEST_PREFERENCES_KEY) ?? '{}') };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveGuestPreferences(preferences: Preferences): void {
  localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(preferences));
}
