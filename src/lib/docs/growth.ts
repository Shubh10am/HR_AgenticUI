import { BarChart3, Gift, GraduationCap, Handshake, Target } from 'lucide-react';
import type { DocSection } from './types';

export const growth: DocSection = {
  id: 'growth',
  title: 'Growth & engagement',
  description: 'Goals and reviews, 1:1s, learning, rewards and pulse surveys.',
  pages: [
    {
      slug: 'performance',
      title: 'Performance',
      icon: Target,
      route: '/performance',
      summary: 'Set goals, track progress and run review cycles.',
      audience: ['Everyone'],
      overview: [
        'Goals: write what you want to achieve, update progress as you go, and your manager can see where you are.',
        'Reviews: HR opens a review cycle; each person writes a self-review and their manager writes theirs.',
      ],
      features: [
        { title: 'Goals', description: 'Title, target date and progress, for you and for your team if you manage people.' },
        { title: 'Review cycles', description: 'HR starts a cycle for a period. Self and manager reviews are collected in one place.' },
      ],
    },
    {
      slug: 'one-on-ones',
      title: '1:1s',
      icon: Handshake,
      route: '/one-on-ones',
      summary: 'Regular check-ins between a manager and each report: a shared agenda, notes and action items.',
      audience: ['Everyone', 'Manager'],
      overview: [
        'A 1:1 is a regular conversation between you and your manager, or you and someone who reports to you. Either person can book it and add topics to the agenda beforehand.',
        'During the meeting, write shared notes and agree action items with an owner. Unfinished actions carry over to your next 1:1 automatically, so nothing is forgotten.',
      ],
      features: [
        { title: 'Shared agenda', description: 'Both people add topics and tick them off as you cover them.' },
        { title: 'Action items', description: 'Each action has an owner — you or the other person.' },
        { title: 'Shared notes', description: 'A record of what you discussed that both of you can see and edit.' },
        { title: 'Private notes', description: 'Notes only you can see. Not the other person, not HR, not admins.' },
        { title: 'Upcoming and past', description: 'Your list on the left; click any meeting to open it.' },
      ],
      howTos: [
        {
          id: 'book-one-on-one',
          title: 'Book a 1:1',
          steps: [
            { title: 'Click “Book a 1:1”', body: 'You can book with your manager or anyone who reports to you.' },
            { title: 'Pick a time', body: 'Choose the date and time and, if you like, the first topic.' },
            { title: 'Add topics', body: 'Before you meet, add anything you want to talk about. The other person sees it too.' },
            { title: 'Mark it done', body: 'After the meeting, save your notes and click “Mark done”.' },
          ],
        },
      ],
      callouts: [{ tone: 'info', title: 'Who you can book with', body: 'People are linked through the Hierarchy page. If you can’t book with someone, ask an admin to set your manager there.' }],
    },
    {
      slug: 'learning',
      title: 'Learning',
      icon: GraduationCap,
      route: '/learning',
      summary: 'Courses, mandatory training with due dates, and certificates.',
      audience: ['Everyone'],
      overview: [
        'Learning lists the courses assigned to you and a catalogue you can choose from. Courses can link to training hosted anywhere; when you finish, mark it complete and you get a certificate number.',
        'Mandatory courses are given to everyone automatically, including new joiners, with a due date. HR sees how many people have completed each one.',
      ],
      features: [
        { title: 'My learning', description: 'Your courses with status, due date and who assigned them. Overdue courses are flagged in red.' },
        { title: 'Catalogue', description: 'Every available course. Click “Start course” to add it to My learning.' },
        { title: 'Assign', description: 'Managers assign courses to their reports; HR and admins to anyone or everyone.' },
        { title: 'Compliance (HR and admins)', description: 'Completion and overdue counts for each course.' },
      ],
      howTos: [
        {
          id: 'complete-course',
          title: 'Complete a course',
          steps: [
            { title: 'Open the course', body: 'In My learning, click Open to go to the training.' },
            { title: 'Finish it', body: 'Work through the material.' },
            { title: 'Mark complete', body: 'Back in Learning, click “Mark complete”. Your certificate number appears on the course.' },
          ],
        },
        {
          id: 'add-mandatory',
          title: 'Add mandatory training (HR)',
          steps: [
            { title: 'Click “Add course”', body: 'Enter a title, description, category, length and https link.' },
            { title: 'Turn on “Mandatory for everyone”', body: 'Choose how many days people have to finish it.' },
            { title: 'Save', body: 'Everyone gets it at once; track progress in the Compliance tab.' },
          ],
        },
      ],
    },
    {
      slug: 'rewards',
      title: 'Rewards',
      icon: Gift,
      route: '/rewards',
      summary: 'Earn points from kudos and awards, then spend them on rewards.',
      audience: ['Everyone'],
      overview: [
        'Each time a colleague gives you kudos in the Community, you earn 25 points. HR and admins can also award points for something special. Spend your points in the catalogue — HR delivers the reward.',
      ],
      features: [
        { title: 'Your points', description: 'Your balance and what you earned this month.' },
        { title: 'Catalogue', description: 'Rewards with their cost and stock. The button tells you how many more points you need.' },
        { title: 'My points', description: 'Every point earned or spent, with the reason.' },
        { title: 'Top this month', description: 'The colleagues who earned the most points this month.' },
        { title: 'Requests (HR and admins)', description: 'Mark redeemed rewards as delivered, or decline them — points are refunded automatically.' },
      ],
      howTos: [
        {
          id: 'redeem',
          title: 'Redeem a reward',
          steps: [
            { title: 'Open the Catalogue', body: 'Rewards you can afford have an active Redeem button.' },
            { title: 'Click Redeem and confirm', body: 'The points leave your balance and the request goes to HR.' },
            { title: 'Track it', body: 'In My points, the request shows Requested, then Delivered.' },
          ],
        },
      ],
      callouts: [{ tone: 'info', title: 'Fair play', body: 'Each person’s first five kudos a month earn points for the people they thank. More kudos are welcome, but don’t add points — so points can’t be traded between friends.' }],
    },
    {
      slug: 'surveys',
      title: 'Surveys',
      icon: BarChart3,
      route: '/surveys',
      summary: 'Short pulse surveys with anonymous answers.',
      audience: ['Everyone'],
      overview: [
        'HR runs short surveys to hear how people feel. Answers to anonymous surveys are stored separately from who took part, so nobody — including HR — can see your answers.',
        'Results only appear once at least five people have answered, and department breakdowns hide any department with fewer than five answers.',
      ],
      features: [
        { title: 'Answer', description: 'Open surveys waiting for you appear at the top.' },
        { title: 'Results', description: 'Scores and charts for HR and admins, once enough people have answered.' },
      ],
    },
  ],
};
