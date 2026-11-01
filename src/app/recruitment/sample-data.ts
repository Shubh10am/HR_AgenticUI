// Fictional sample data so anyone can try the flow end to end.
import type { RoleDetails } from './store';

export const SAMPLE_ROLE: RoleDetails = {
  title: 'Senior Frontend Engineer',
  department: 'Engineering',
  location: 'Bengaluru',
  workMode: 'Hybrid',
  employmentType: 'Full-time',
  level: 'Senior',
  mustHaves: '- 5+ years building web apps with React and TypeScript\n- Experience owning features end to end, from design to production\n- Strong grasp of accessibility and performance',
  niceToHaves: '- Next.js App Router\n- Design systems / component libraries\n- Mentoring other engineers',
  salaryRange: '',
  notes: 'Small product team building an HR platform; 2 days a week in office.',
};

export const SAMPLE_RESUMES: { label: string; text: string }[] = [
  {
    label: 'Sample resume: strong match',
    text: `Alex Rivera
Senior Frontend Engineer

EXPERIENCE
Brightlane (B2B SaaS), Senior Frontend Engineer, 2021 – present
- Led the rebuild of the customer dashboard in React 18 + TypeScript and Next.js; cut load time by 45%.
- Built and documented a shared design system (40+ components) used by 4 product teams.
- Owned accessibility: brought the app to WCAG 2.1 AA, added automated axe checks to CI.
- Mentored 3 junior engineers; ran weekly frontend guild.

Northwind Labs, Frontend Engineer, 2018 – 2021
- Built React features for a scheduling product from design through release.
- Introduced performance budgets and code-splitting; improved Lighthouse score from 62 to 94.

SKILLS
React, TypeScript, Next.js, Testing Library, Playwright, CSS, Web performance, Accessibility`,
  },
  {
    label: 'Sample resume: partial match',
    text: `Sam Okoye
Web Developer

EXPERIENCE
PixelForge Agency, Web Developer, 2022 – present
- Build marketing websites with WordPress, jQuery and some Vue.js.
- Collaborate with designers to turn Figma mockups into responsive pages.

Freelance, Junior Developer, 2021 – 2022
- Small JavaScript projects for local businesses.

SKILLS
JavaScript, HTML, CSS, Vue.js (basic), WordPress, Figma`,
  },
];
