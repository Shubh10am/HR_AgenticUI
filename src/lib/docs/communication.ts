import { FileSignature, Inbox, MailPlus, MessageCircle, MessagesSquare } from 'lucide-react';
import type { DocSection } from './types';

export const communication: DocSection = {
  id: 'communication',
  title: 'Communication',
  description: 'Email, drafting and your team feed — with AI replies built in.',
  pages: [
    {
      slug: 'gmail-inbox',
      title: 'Gmail Inbox',
      icon: Inbox,
      route: '/gmail-inbox',
      summary: 'Read, answer and manage Gmail and your calendar, with AI replies one click away.',
      audience: ['Everyone'],
      overview: [
        'The Gmail Inbox brings your Google mailbox and primary calendar into HR Streamline. It looks and works like Gmail — folders, categories, a reading pane — and adds an AI reply bar to every email.',
        'AI replies use your Knowledge Base, so an answer about leave or attendance quotes your actual policy. You always review the draft before sending.',
      ],
      features: [
        { title: 'Folders & categories', description: 'Inbox, Sent and Spam, plus All, Social, Promotions, Updates and Forums tabs. Load more as you scroll.' },
        { title: 'AI reply bar', description: '“Generate AI Reply Options” offers several drafts in different tones. “One-click reply” drafts an Acknowledge, Ask for details, Propose a meeting or Decline politely reply.' },
        { title: 'Quick Reply with AI', description: 'Type a short instruction in any language; the AI writes a professional English reply into the reply box.' },
        { title: 'Verification codes', description: 'One-time codes in sign-in emails are detected and shown with a Copy code button.' },
        { title: 'Safe email display', description: 'Each email is shown in an isolated frame and scaled to fit, so newsletters keep their layout without affecting the app.' },
        { title: 'Calendar', description: 'See upcoming events from your Google primary calendar alongside your mail.' },
      ],
      howTos: [
        {
          id: 'connect-gmail',
          title: 'Connect your Google account',
          steps: [
            { title: 'Open Gmail Inbox', body: 'If Google is not connected yet, you will see Connect Google Account.' },
            { title: 'Sign in with Google', body: 'Approve access to Gmail and Calendar. You return to the inbox automatically.' },
            { title: 'Refresh', body: 'Your latest emails load. Use the refresh button any time.' },
          ],
        },
        {
          id: 'reply-with-ai',
          title: 'Reply to an email with AI',
          steps: [
            { title: 'Open the email', body: 'Click it in the list, or hover it and press the “AI reply” chip.' },
            { title: 'Pick a reply style', body: 'Generate AI Reply Options for several drafts, or choose a one-click reply from the menu.' },
            { title: 'Review and edit', body: 'The draft appears in the reply box at the bottom. Adjust anything you need.' },
            { title: 'Send', body: 'Press Send Reply. It goes out from your Gmail account in the same thread.' },
          ],
        },
      ],
      callouts: [
        { tone: 'info', title: 'Requires Google', body: 'Guests and accounts without a Google connection see a prompt to connect instead of mail.' },
      ],
      faqs: [
        { question: 'Is anything sent without me?', answer: 'No. AI only drafts. An email is sent only when you press Send Reply.' },
        { question: 'Does deleting here delete it in Gmail?', answer: 'Yes. Delete moves the email to Gmail’s trash.' },
      ],
    },
    {
      slug: 'email-assistance',
      title: 'Email Assistance',
      icon: MailPlus,
      route: '/email-assistance',
      summary: 'Paste an employee question and get ready-to-send reply drafts.',
      audience: ['Everyone'],
      overview: [
        'Email Assistance is for questions that arrive outside Gmail — a chat message, a form, a note. Paste the question and the AI writes several professional replies in different tones.',
      ],
      howTos: [
        {
          id: 'draft-a-response',
          title: 'Draft a response',
          steps: [
            { title: 'Paste the employee query', body: 'Copy the question into the Employee Query box.' },
            { title: 'Generate drafts', body: 'The AI returns several options, each with a subject and body.' },
            { title: 'Use a draft', body: 'Choose one to open it in Smart Drafting, where you can edit and send it.' },
          ],
        },
      ],
    },
    {
      slug: 'smart-drafting',
      title: 'Smart Drafting',
      icon: FileSignature,
      route: '/smart-drafting',
      summary: 'Write new emails from a prompt, then edit and send them.',
      audience: ['Everyone'],
      overview: [
        'Smart Drafting turns a short prompt — “announce the office closure on Friday” — into polished email options. Load one into the composer, address it, and send it through your Google account.',
      ],
      features: [
        { title: 'Prompt to drafts', description: 'Describe the email; get several options to choose from.' },
        { title: 'Composer', description: 'To (comma-separated addresses), Subject and Body, with copy to clipboard.' },
        { title: 'Send', description: 'Sends through your connected Google account.' },
        { title: 'Hand-off', description: 'Drafts chosen in Email Assistance open here automatically.' },
      ],
      callouts: [
        { tone: 'info', title: 'Sending needs Google', body: 'You can draft without Google, but sending requires a connected Google account.' },
      ],
    },
    {
      slug: 'community',
      title: 'Community',
      icon: MessageCircle,
      route: '/community',
      summary: 'Your organization’s internal feed for updates, likes and comments.',
      audience: ['Everyone'],
      overview: [
        'Community is a private feed for your organization. Leaders post announcements and updates; everyone can like and comment.',
      ],
      features: [
        { title: 'Posts', description: 'Admins, HR and Managers create posts with a topic, subject and content.' },
        { title: 'Likes & comments', description: 'Everyone can like and comment. Authors and Admins can edit or delete comments.' },
        { title: 'Events & birthdays', description: 'Side cards highlight upcoming events and team birthdays.' },
      ],
    },
    {
      slug: 'unified-communications',
      title: 'Unified Communications',
      icon: MessagesSquare,
      route: '/unified-communications',
      summary: 'One view of team communication across connected platforms.',
      audience: ['Everyone'],
      maturity: 'preview',
      overview: [
        'Unified Communications is where conversation activity from connected platforms comes together in one place: an overview of integrated platforms and a stream of recent communication logs.',
      ],
      callouts: [
        { tone: 'warning', title: 'Preview', body: 'This module currently shows sample data to illustrate the experience. Live data from connected platforms is not yet wired in.' },
      ],
    },
  ],
};
