import { Compass, KeyRound, LayoutDashboard, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import type { DocSection } from './types';

export const gettingStarted: DocSection = {
  id: 'getting-started',
  title: 'Getting started',
  description: 'What the platform is, how to set it up, and how the AI fits in.',
  pages: [
    {
      slug: 'introduction',
      title: 'Introduction',
      icon: Compass,
      summary: 'What HR Streamline AI is and everything it brings together.',
      audience: ['Everyone'],
      overview: [
        'HR Streamline AI is an agentic HR workspace. It brings email, recruiting, attendance, people management and company knowledge into one place, and adds AI assistants that draft, screen, summarise and answer so your HR team spends less time on admin.',
        'Every organization gets its own private workspace. People sign in with their own account, and what they can see and change depends on their role (Admin, HR, Manager or Employee).',
        'The AI is built in, not bolted on: Copilot answers questions next to any page, AI replies appear inside the inbox, and the Knowledge Base makes sure answers follow your own policies rather than generic advice.',
      ],
      features: [
        { title: 'Communication', description: 'Gmail inbox with AI replies, smart drafting and sending, a team community feed, and email assistance for employee questions.' },
        { title: 'People', description: 'AI recruitment tools, employee records with bulk CSV import, attendance and leave, org chart, onboarding and payroll overviews.' },
        { title: 'Workspace', description: 'A company Knowledge Base the AI answers from, a task board, integrations, and a support desk.' },
        { title: 'AI throughout', description: 'Copilot chat, reply drafting, job descriptions, resume scoring, AI interviews — all grounded in your organization’s knowledge.' },
      ],
      callouts: [
        { tone: 'info', title: 'Modules marked “Preview”', body: 'A few modules — Payroll, Unified Communications, Employee Hierarchy and Onboarding — currently show sample data so you can see how they will work. Their guides say so clearly.' },
      ],
    },
    {
      slug: 'quick-start',
      title: 'Quick start',
      icon: Rocket,
      summary: 'Set up your organization and team in about fifteen minutes.',
      audience: ['Admin'],
      overview: [
        'This checklist takes a new organization from sign-up to a working AI workspace. Do the steps in order — each one unlocks the next.',
      ],
      howTos: [
        {
          id: 'setup-checklist',
          title: 'Setup checklist',
          steps: [
            { title: 'Register your organization', body: 'Go to Register, enter your organization and admin details. This first account is your organization’s Admin.' },
            { title: 'Choose your AI provider', body: 'In Settings → AI Provider, pick Gemini, Claude, OpenAI, Grok, Qwen, DeepSeek, Mistral, Groq, OpenRouter or any OpenAI-compatible service, then add your API key. Without one, the platform’s shared Gemini key is used if available.' },
            { title: 'Add your team', body: 'Open Manage Employees and add people one by one, or import everyone at once with a CSV file (name, email, password, role, optional department).' },
            { title: 'Teach the AI your policies', body: 'Upload your handbook and policies to the Knowledge Base. Copilot and AI email replies will start answering from them.' },
            { title: 'Connect Google', body: 'On Integrations, connect your Google account to use the Gmail inbox, calendar and sending from Smart Drafting.' },
            { title: 'Take the tour', body: 'The guided tour walks through every module the first time you sign in. You can restart it any time from your user menu.' },
          ],
        },
      ],
      callouts: [
        { tone: 'tip', title: 'Just exploring?', body: 'Use “Try now” on the home page to explore as a guest. Guest mode shows the interface with sample data; saving, AI and Google features need a real account.' },
      ],
    },
    {
      slug: 'roles-and-access',
      title: 'Roles & access',
      icon: ShieldCheck,
      summary: 'Who can see and do what across the platform.',
      audience: ['Everyone'],
      overview: [
        'Each person has one role in their organization. Roles decide which modules appear in the sidebar and which actions are allowed. Your data is always limited to your own organization.',
      ],
      features: [
        { title: 'Admin', description: 'Full control: employees (add, edit, delete, bulk import), organization settings and AI provider, attendance management, onboarding, and Knowledge Base editing.' },
        { title: 'HR', description: 'Attendance management, onboarding, Knowledge Base editing and attendance policy editing. Employee records are managed by Admins.' },
        { title: 'Manager', description: 'Everything employees can do, plus creating posts in the Community feed.' },
        { title: 'Employee', description: 'Their own attendance and leave, Copilot, AI email tools, recruitment tools, tasks, Knowledge Base search and Ask, and support tickets.' },
        { title: 'Guest', description: 'A read-only preview with sample data. Sign up to save anything or use AI and Google features.' },
        { title: 'Platform admin', description: 'Operators of HR Streamline itself. They use the separate admin console and have no organization workspace.' },
      ],
    },
    {
      slug: 'ai-overview',
      title: 'How the AI works',
      icon: Sparkles,
      summary: 'Where AI appears, what powers it, and how it stays grounded in your policies.',
      audience: ['Everyone'],
      overview: [
        'HR Streamline AI works with the AI provider your organization chooses: Google Gemini (the default), Anthropic Claude, OpenAI, xAI Grok, Alibaba Qwen, DeepSeek, Mistral, Groq, OpenRouter, or any OpenAI-compatible service. An Admin picks the provider and model in Settings and adds your own API key, so usage is billed to you and tracked on the usage page.',
        'Your key stays on the server. It is encrypted, never sent back to the browser, and Settings tests it before saving so a wrong key cannot break AI for your team.',
        'Answers about your company come from your Knowledge Base. When you ask Copilot a question or generate an email reply, the platform first searches your organization’s documents and built-in policies, then asks the AI to answer using those passages and to say which documents it used.',
        'Nothing is sent automatically. AI output is always a draft you review — replies land in the reply box, job descriptions and interview summaries appear on screen for you to copy or edit.',
      ],
      features: [
        { title: 'Copilot', description: 'A chat panel available on every page. Ask about policies, get help writing, or think through a task.' },
        { title: 'AI email replies', description: 'Generate several reply options, or one-click replies such as Acknowledge or Ask for details, right inside the inbox.' },
        { title: 'Recruitment AI', description: 'Job descriptions from a prompt, ATS scoring of resumes against a job, and a simulated AI interviewer.' },
        { title: 'Knowledge answers', description: 'Ask your Knowledge Base directly and get an answer with clickable sources.' },
      ],
      callouts: [
        { tone: 'warning', title: 'Keep personal data out of prompts and uploads', body: 'Use the Knowledge Base for policies and guides. Do not upload individual employee records, medical or health information, or other personal data.' },
        { tone: 'info', title: 'Your data stays in your organization', body: 'Knowledge searches are always limited to your organization, using the organization from your sign-in rather than anything the browser sends.' },
      ],
      faqs: [
        { question: 'Which AI model is used?', answer: 'Google Gemini Flash for writing and answering, and Gemini embeddings for Knowledge Base search.' },
        { question: 'Why did an AI feature fail?', answer: 'Usually the AI key is missing, invalid or out of quota, or the model name has changed. Open Settings → AI Provider and use Test connection, then try again.' },
      ],
    },
    {
      slug: 'navigating',
      title: 'Navigating the app',
      icon: LayoutDashboard,
      route: '/dashboard',
      summary: 'The dashboard, sidebar, Copilot panel and guided tour.',
      audience: ['Everyone'],
      overview: [
        'After signing in you land on the Dashboard: a greeting, key numbers and quick links to every module. The sidebar groups modules into Overview, Communication, People and Workspace, and can be collapsed to icons.',
      ],
      features: [
        { title: 'Dashboard', description: 'Your starting point, with shortcuts to drafting, your inbox and every module.' },
        { title: 'Sidebar', description: 'Grouped navigation. Collapse it with the button in the header or Ctrl/⌘ + B.' },
        { title: 'Copilot', description: 'Open it from the header or “Ask Copilot” at the bottom of the sidebar. Answers show which knowledge-base documents they used.' },
        { title: 'Guided tour', description: 'Runs on first sign-in, step by step through each module you have access to. Restart it from the user menu.' },
      ],
    },
    {
      slug: 'account-security',
      title: 'Your account',
      icon: KeyRound,
      route: '/profile',
      summary: 'Profile, password, and signing in.',
      audience: ['Everyone'],
      overview: [
        'Your profile holds your name and email. You can change your password in Settings at any time. Sessions last a day, after which you sign in again.',
      ],
      howTos: [
        {
          id: 'change-password',
          title: 'Change your password',
          steps: [
            { title: 'Open Settings', body: 'Use the user menu in the top-right corner.' },
            { title: 'Choose Change password', body: 'Enter your current password, then the new one twice.' },
            { title: 'Save', body: 'You stay signed in; the new password applies next time.' },
          ],
        },
      ],
    },
  ],
};
