/** Shared between the 1:1 API and UI. Safe to import on the client. */
export type OneOnOneStatus = 'scheduled' | 'completed' | 'cancelled';

export interface AgendaItemView {
  id: string;
  text: string;
  addedByName: string;
  done: boolean;
}

export interface ActionItemView {
  id: string;
  text: string;
  ownerName: string;
  ownerId: string;
  done: boolean;
}

export interface OneOnOneView {
  id: string;
  manager: { id: string; name: string };
  report: { id: string; name: string; jobTitle: string };
  /** The other person in the meeting, from the viewer's side. */
  withPerson: { id: string; name: string };
  iAmManager: boolean;
  scheduledFor: string;
  status: OneOnOneStatus;
  agenda: AgendaItemView[];
  sharedNotes: string;
  /** Only the viewer's own private notes; the other person's are never sent. */
  myPrivateNotes: string;
  actions: ActionItemView[];
}

export interface OneOnOneOverview {
  meetings: OneOnOneView[];
  /** People the viewer can book a 1:1 with: their reports and their manager. */
  people: { id: string; name: string; relation: 'report' | 'manager' }[];
}
