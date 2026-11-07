/** Shared between the surveys API and UI. Safe to import on the client. */
export type QuestionKind = 'enps' | 'scale' | 'choice' | 'text';
export type SurveyStatus = 'draft' | 'open' | 'closed';

export interface SurveyQuestion {
  key: string;
  kind: QuestionKind;
  text: string;
  options?: string[];
}

/** Results stay hidden until this many people have answered, so no one can be singled out. */
export const MIN_RESPONSES = 5;

export const SURVEY_TEMPLATES: { id: string; title: string; description: string; questions: SurveyQuestion[] }[] = [
  {
    id: 'enps',
    title: 'Quarterly eNPS',
    description: 'One quick question on how likely people are to recommend us as a place to work.',
    questions: [
      { key: 'enps', kind: 'enps', text: 'How likely are you to recommend this company as a place to work?' },
      { key: 'why', kind: 'text', text: 'What is the main reason for your score?' },
    ],
  },
  {
    id: 'wellbeing',
    title: 'Wellbeing check-in',
    description: 'Workload, balance and support — a short pulse.',
    questions: [
      { key: 'workload', kind: 'scale', text: 'My workload is manageable.' },
      { key: 'balance', kind: 'scale', text: 'I can balance work with my life outside work.' },
      { key: 'support', kind: 'scale', text: 'I know where to get support if I need it.' },
      { key: 'help', kind: 'text', text: 'What one thing would improve your wellbeing at work?' },
    ],
  },
  {
    id: 'manager',
    title: 'Manager effectiveness',
    description: 'How well managers support, coach and communicate.',
    questions: [
      { key: 'clarity', kind: 'scale', text: 'My manager gives me clear priorities.' },
      { key: 'feedback', kind: 'scale', text: 'My manager gives me useful feedback.' },
      { key: 'growth', kind: 'scale', text: 'My manager supports my growth.' },
      { key: 'meetings', kind: 'choice', text: 'How often do you have a 1:1 with your manager?', options: ['Weekly', 'Every two weeks', 'Monthly', 'Rarely'] },
    ],
  },
];

export const SCALE_LABELS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

export interface SurveyView {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  closesAt: string | null;
  questions: SurveyQuestion[];
  responses: number;
  invited: number;
  answered: boolean;
  createdAt: string;
}

export type QuestionResult =
  | { key: string; kind: 'enps'; text: string; score: number; promoters: number; passives: number; detractors: number; distribution: number[] }
  | { key: string; kind: 'scale'; text: string; average: number; distribution: number[] }
  | { key: string; kind: 'choice'; text: string; counts: { option: string; count: number }[] }
  | { key: string; kind: 'text'; text: string; answers: string[] };

export interface SurveyResults {
  survey: SurveyView;
  /** False when fewer than MIN_RESPONSES people answered. */
  visible: boolean;
  questions: QuestionResult[];
  byDepartment: { department: string; responses: number; enps: number | null; scaleAverage: number | null }[];
}
