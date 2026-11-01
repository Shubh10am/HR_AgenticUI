// Client-safe types shared by the communications API and page.

export type CommSource = 'gmail' | 'calendar' | 'community';
export type CommPlatform = 'Email' | 'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'Calendar' | 'Community';

export interface CommItem {
  id: string;
  source: CommSource;
  platform: CommPlatform;
  /** Who it was with: sender, recipient, organizer or author. */
  counterpart: string;
  summary: string;
  type: string;
  at: string;
  /** Where to open it in the app or provider, when there is one. */
  link: string | null;
}

export interface CommSourceStatus {
  id: CommSource;
  label: string;
  /** 'connected', 'not-connected' (needs Google sign-in), or 'error' (connected but the read failed). */
  state: 'connected' | 'not-connected' | 'error';
  count: number;
  message?: string;
}
