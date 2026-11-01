import { Building2, ClipboardList, LibraryBig, LifeBuoy, Plug, Settings } from 'lucide-react';
import type { DocSection } from './types';

export const workspace: DocSection = {
  id: 'workspace',
  title: 'Workspace',
  description: 'Company knowledge, tasks, integrations, support and settings.',
  pages: [
    {
      slug: 'knowledge-base',
      title: 'Knowledge Base',
      icon: LibraryBig,
      route: '/knowledge-base',
      summary: 'Your policies and documents, searchable by AI and used by Copilot and email replies.',
      audience: ['Everyone'],
      overview: [
        'The Knowledge Base is where your organization keeps its handbooks, policies and guides. Every document is read and indexed for AI search, so anyone can ask a question and get an answer with sources.',
        'It also powers the rest of the platform: Copilot and AI email replies search it first, so their answers follow your rules — including the built-in Attendance, Leave and Code of Conduct policies.',
      ],
      features: [
        { title: 'Ask your knowledge base', description: 'Type a question; get an answer written only from your documents, with numbered, clickable sources. If it is not covered, it says so instead of guessing.' },
        { title: 'Folders', description: 'Organize documents in nested folders with breadcrumb navigation.' },
        { title: 'Upload', description: 'Drag and drop PDF, Word (.docx), TXT or Markdown files, up to 10 MB each, several at once, with progress per file.' },
        { title: 'AI-ready status', description: 'Each document shows AI-ready, Indexing or Not indexed. Re-index any document from its menu.' },
        { title: 'Search & preview', description: 'Search file names and contents; open a side panel to read a document’s text.' },
        { title: 'Manage', description: 'Rename, re-index and delete, with a confirmation before anything is removed.' },
      ],
      howTos: [
        {
          id: 'add-documents',
          title: 'Add documents',
          steps: [
            { title: 'Create a folder (optional)', body: 'For example “Policies” or “Benefits”.' },
            { title: 'Upload', body: 'Drop your files in. Text is read in your browser and saved to your organization.' },
            { title: 'Wait for AI-ready', body: 'Indexing takes seconds per document. The badge turns to AI-ready when Copilot can use it.' },
          ],
        },
        {
          id: 'ask-a-question',
          title: 'Ask a question',
          steps: [
            { title: 'Type a question', body: 'Use the Ask box at the top, or try a suggested question.' },
            { title: 'Read the answer', body: 'Numbers like [1] show which source each statement came from.' },
            { title: 'Check the source', body: 'Click a source to open the document and read it in full.' },
          ],
        },
      ],
      callouts: [
        { tone: 'warning', title: 'What not to upload', body: 'Policies, handbooks and guides only. Do not upload individual employee records, medical or health information, or other personal data.' },
        { tone: 'info', title: 'Who can edit', body: 'Admins and HR upload, rename and delete. Everyone in the organization can search and ask.' },
        { tone: 'tip', title: 'Scanned PDFs', body: 'Image-only PDFs have no readable text. Export them as text-based PDFs or Word documents first.' },
      ],
      faqs: [
        { question: 'A document says “Not indexed”. What now?', answer: 'Indexing uses Gemini, so it needs a working Google key — your own when Gemini is your provider, otherwise the platform’s. Check Settings → AI Provider, then choose Re-index for AI from the document’s menu.' },
        { question: 'Can other organizations see our documents?', answer: 'No. Every search is limited to the organization of the signed-in user.' },
      ],
    },
    {
      slug: 'tasks',
      title: 'Tasks',
      icon: ClipboardList,
      route: '/tasks',
      summary: 'A Kanban board for HR work: to do, in progress, review and done.',
      audience: ['Everyone'],
      overview: [
        'Tasks gives you a simple board to plan HR work — onboarding checklists, policy reviews, events — and move cards across columns as they progress. Open a task to add details and comments.',
      ],
      callouts: [
        { tone: 'warning', title: 'Saved in your browser', body: 'Tasks are currently stored on your own device and are not shared with teammates. The board starts with sample tasks.' },
      ],
    },
    {
      slug: 'integrations',
      title: 'Integrations',
      icon: Plug,
      route: '/integrations',
      summary: 'Connect Google and see which other tools are available.',
      audience: ['Everyone'],
      overview: [
        'Integrations is where you connect HR Streamline to the tools you already use. Google is fully supported today and unlocks the Gmail Inbox, Calendar and sending from Smart Drafting.',
      ],
      features: [
        { title: 'Google (Gmail & Calendar)', description: 'Connect or disconnect your Google account with one click.' },
        { title: 'More tools', description: 'Other integrations such as Slack, Teams and Jira are listed; request the one you need.' },
        { title: 'Request an integration', description: 'Tell us the tool and your use case so we can prioritise it.' },
      ],
      callouts: [
        { tone: 'info', title: 'Disconnecting', body: 'Disconnecting Google stops the inbox and sending immediately. Nothing is deleted from your Google account.' },
      ],
    },
    {
      slug: 'support',
      title: 'Get Support',
      icon: LifeBuoy,
      route: '/support',
      summary: 'Raise support tickets and follow their status.',
      audience: ['Everyone'],
      overview: [
        'Need help? Raise a ticket with a subject, priority and description. Your ticket history shows every request and its status. Attendance correction requests also arrive here.',
      ],
      howTos: [
        {
          id: 'raise-ticket',
          title: 'Raise a ticket',
          steps: [
            { title: 'Open Get Support', body: 'From the Workspace section of the sidebar.' },
            { title: 'Describe the issue', body: 'Add a clear subject, choose a priority and explain what happened.' },
            { title: 'Track it', body: 'Follow progress in My Ticket History.' },
          ],
        },
      ],
    },
    {
      slug: 'settings',
      title: 'Settings',
      icon: Settings,
      route: '/settings',
      summary: 'Password, AI provider and key, usage and account controls.',
      audience: ['Everyone'],
      overview: [
        'Settings holds your personal and organization preferences. Admins choose the organization’s AI provider, model and API key here; every AI feature uses them.',
      ],
      features: [
        { title: 'AI Provider', description: 'Choose Gemini, Claude, OpenAI, Grok, Qwen, DeepSeek, Mistral, Groq, OpenRouter or a custom OpenAI-compatible endpoint, pick a model and add your key. Test connection checks it first; keys are encrypted and never shown again.' },
        { title: 'AI usage', description: 'See how much AI your organization has used, by feature.' },
        { title: 'Change password', description: 'Update your password any time.' },
        { title: 'Delete account or organization', description: 'Employees can delete their account. Admins can delete the whole organization after typing its name and their password.' },
      ],
      callouts: [
        { tone: 'warning', title: 'Deleting an organization is permanent', body: 'It removes the organization and its data. Export anything you need first.' },
        { tone: 'info', title: 'Notification switches', body: 'Email and Slack notification toggles are placeholders and do not send notifications yet.' },
      ],
    },
    {
      slug: 'platform-admin',
      title: 'Platform admin console',
      icon: Building2,
      route: '/admin/dashboard',
      summary: 'For HR Streamline operators: organizations, users, tickets and moderation.',
      audience: ['Platform admin'],
      overview: [
        'The admin console is for the team that runs HR Streamline, not for customer organizations. Platform admins sign in with an account that has no organization.',
      ],
      features: [
        { title: 'Organizations', description: 'List, view and update customer organizations and their status.' },
        { title: 'Platform users', description: 'Create, edit and remove platform admin accounts.' },
        { title: 'Support tickets', description: 'View, update and assign tickets raised by organizations.' },
        { title: 'Inquiries & moderation', description: 'Review contact and demo requests, and moderate community posts.' },
      ],
    },
  ],
};
