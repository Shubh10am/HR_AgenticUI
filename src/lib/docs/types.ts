import type { LucideIcon } from 'lucide-react';

export type DocAudience = 'Everyone' | 'Admin' | 'HR' | 'Manager' | 'Employee' | 'Platform admin';

/** How finished a module is, so the docs never oversell it. */
export type DocMaturity = 'live' | 'preview';

export interface DocFeature {
  title: string;
  description: string;
}

export interface DocStep {
  title: string;
  /** Plain text; keep to a sentence or two. */
  body: string;
}

export interface DocHowTo {
  id: string;
  title: string;
  steps: DocStep[];
}

export interface DocFaq {
  question: string;
  answer: string;
}

export interface DocCallout {
  tone: 'info' | 'tip' | 'warning';
  title: string;
  body: string;
}

/** One documentation page, usually one product module. */
export interface DocPage {
  slug: string;
  title: string;
  icon: LucideIcon;
  /** One-line summary shown on cards and under the title. */
  summary: string;
  /** Route of the module in the app, when it has one. */
  route?: string;
  audience: DocAudience[];
  maturity?: DocMaturity;
  /** Short paragraphs explaining what the module is for. */
  overview: string[];
  features?: DocFeature[];
  howTos?: DocHowTo[];
  callouts?: DocCallout[];
  faqs?: DocFaq[];
}

export interface DocSection {
  id: string;
  title: string;
  description: string;
  pages: DocPage[];
}
