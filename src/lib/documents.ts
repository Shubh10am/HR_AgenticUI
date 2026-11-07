/** Shared between the documents API and UI. Safe to import on the client. */

export interface PolicyDocView {
  id: string;
  title: string;
  body: string;
  version: number;
  requiresAck: boolean;
  updatedAt: string;
  /** The viewer's signature on the current version, if any. */
  myAck: { signedName: string; at: string } | null;
  /** HR and admins only. */
  ackCount: number | null;
  headcount: number | null;
}

export interface AckStatusView {
  signed: { id: string; name: string; department: string; signedName: string; at: string }[];
  pending: { id: string; name: string; department: string }[];
}

export const LETTER_TEMPLATES = [
  {
    key: 'employment',
    title: 'Employment verification letter',
    body:
      '{{date}}\n\nTo whom it may concern,\n\nThis is to confirm that {{name}} is employed with {{organization}} as {{jobTitle}} in the {{department}} team, and has been with us since {{joinedOn}}.\n\nThis letter is issued on request{{purposeClause}}.\n\nSincerely,\n{{issuer}}\nPeople team, {{organization}}',
  },
  {
    key: 'experience',
    title: 'Experience letter',
    body:
      '{{date}}\n\nTo whom it may concern,\n\nThis is to certify that {{name}} worked with {{organization}} as {{jobTitle}} in the {{department}} team from {{joinedOn}} to {{lastWorkingDay}}.\n\nWe thank them for their contributions and wish them every success.\n\nSincerely,\n{{issuer}}\nPeople team, {{organization}}',
  },
  {
    key: 'relieving',
    title: 'Relieving letter',
    body:
      '{{date}}\n\nDear {{name}},\n\nThis is to confirm that you have been relieved of your duties as {{jobTitle}} at {{organization}} with effect from the close of business on {{lastWorkingDay}}, and that your exit formalities are complete.\n\nWe wish you the very best.\n\nSincerely,\n{{issuer}}\nPeople team, {{organization}}',
  },
  {
    key: 'address',
    title: 'Address proof letter',
    body:
      '{{date}}\n\nTo whom it may concern,\n\nThis is to confirm that {{name}} is an employee of {{organization}}. The address held in our records is provided by the employee and attached separately on request{{purposeClause}}.\n\nSincerely,\n{{issuer}}\nPeople team, {{organization}}',
  },
] as const;
export type LetterKey = (typeof LETTER_TEMPLATES)[number]['key'];

export interface LetterView {
  id: string;
  template: LetterKey;
  title: string;
  employee: { id: string; name: string; department: string };
  purpose: string;
  status: 'requested' | 'issued' | 'declined';
  body: string;
  issuedByName: string | null;
  issuedAt: string | null;
  createdAt: string;
  mine: boolean;
}
