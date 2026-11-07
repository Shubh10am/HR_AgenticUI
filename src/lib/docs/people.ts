import { CalendarCheck, ClipboardList, DollarSign, GitFork, Network, UserPlus, Users } from 'lucide-react';
import type { DocSection } from './types';

export const people: DocSection = {
  id: 'people',
  title: 'People',
  description: 'Hiring, employee records, attendance, onboarding and payroll.',
  pages: [
    {
      slug: 'recruitment',
      title: 'Recruitment',
      icon: GitFork,
      route: '/recruitment',
      summary: 'AI tools for every hiring step: job descriptions, resume scoring and AI interviews.',
      audience: ['Everyone'],
      overview: [
        'Recruitment collects the AI tools that speed up hiring. Each is a tab: write a job description from a prompt, score a resume against a role, and run a simulated AI interview that produces a transcript and summary.',
        'Results are shown on screen for you to copy, edit or share; they are not stored as candidate records.',
      ],
      features: [
        { title: 'AI Job Description Generator', description: 'Describe the role in a sentence or two; get a complete, structured job description to copy.' },
        { title: 'ATS Score Check & Resume Analysis', description: 'Upload a resume (PDF or TXT) or paste it, add the job description, and get a match score with strengths and gaps.' },
        { title: 'AI Interviewer', description: 'Enter the candidate’s resume, name and number of rounds; get an interview transcript and a hiring summary.' },
        { title: 'Screening & applications', description: 'Guidance on screening and an application board. The application board currently shows sample data.' },
      ],
      howTos: [
        {
          id: 'score-a-resume',
          title: 'Score a resume against a role',
          steps: [
            { title: 'Open the ATS Score Check tab', body: 'In Recruitment, choose ATS Score Check & AI Resume Analysis.' },
            { title: 'Add the resume', body: 'Upload a PDF or TXT file — text is read in your browser — or paste the resume text.' },
            { title: 'Add the job description', body: 'Paste it, or generate one first in the Job Description tab.' },
            { title: 'Analyze', body: 'Review the score, matched skills and gaps before deciding next steps.' },
          ],
        },
      ],
      callouts: [
        { tone: 'warning', title: 'Use AI as an assistant, not a decision-maker', body: 'Scores and summaries support human judgement. Make hiring decisions on job-related criteria and follow the employment laws that apply to you.' },
        { tone: 'info', title: 'Scanned resumes', body: 'Image-only PDFs have no readable text. Paste the text instead.' },
      ],
    },
    {
      slug: 'manage-employees',
      title: 'Manage Employees',
      icon: Users,
      route: '/manage-employees',
      summary: 'Add, edit and remove employees — one at a time or in bulk by CSV.',
      audience: ['Admin'],
      overview: [
        'Manage Employees is the source of truth for who is in your organization. Each employee gets a sign-in and a role, which controls what they can access.',
      ],
      features: [
        { title: 'Directory', description: 'Search by name or email; switch between list and grid views; open an employee for details.' },
        { title: 'Add an employee', description: 'Full name, email (must use your organization’s email domain), department (optional), role and an initial password.' },
        { title: 'Edit & delete', description: 'Change name, role or department, or remove someone who has left.' },
        { title: 'Bulk import & delete', description: 'Register or remove many employees at once from a CSV file, with a per-row report of anything that failed.' },
      ],
      howTos: [
        {
          id: 'bulk-import',
          title: 'Import employees from CSV',
          steps: [
            { title: 'Prepare the file', body: 'Columns: name, email, password, role — plus optional department. Role must be Admin, HR, Manager or Employee.' },
            { title: 'Open Bulk Employee Registration', body: 'Choose your .csv file and upload.' },
            { title: 'Review the results', body: 'Successful rows are created; any failed row is listed with the reason so you can fix and re-upload just those.' },
          ],
        },
      ],
      callouts: [
        { tone: 'info', title: 'Admins only', body: 'HR users can see the link in the sidebar but only Admins can open and manage employee records.' },
        { tone: 'tip', title: 'Share passwords safely', body: 'Ask people to change their initial password in Settings after first sign-in.' },
      ],
    },
    {
      slug: 'my-attendance',
      title: 'My Attendance',
      icon: CalendarCheck,
      route: '/attendance-reporting',
      summary: 'Clock in and out, see your shift, review your records and export reports.',
      audience: ['Everyone'],
      overview: [
        'My Attendance is each employee’s personal attendance hub: clock in when you start, clock out when you finish and see your history. Your shift decides when a clock-in counts as late.',
        'To ask for time off, use the Leave page — it shows your balances and sends the request for approval.',
      ],
      features: [
        { title: 'Clock in / Clock out', description: 'One click records the time against your account.' },
        { title: 'Records & filters', description: 'Your attendance history, filtered by all time, this month or this week.' },
        { title: 'Your shift', description: 'Today’s shift and the time after which a clock-in is marked late. HR sets shifts on the Shifts page.' },
        { title: 'Corrections', description: 'Forgot to clock out? Request a correction; it is sent to the support desk.' },
        { title: 'Exports', description: 'Download your records as CSV or as a text report.' },
        { title: 'Attendance policy', description: 'Read your organization’s policy. Admins and HR can edit it here.' },
      ],
      callouts: [
        { tone: 'info', title: 'Calendar summary', body: 'The calendar overview of present, absent and late days currently shows sample figures; your clock-in records and history are live.' },
      ],
    },
    {
      slug: 'attendance-management',
      title: 'Attendance Management',
      icon: ClipboardList,
      route: '/attendance-management',
      summary: 'See who is present and absent today across the organization.',
      audience: ['Admin', 'HR'],
      overview: [
        'Attendance Management gives Admins and HR a live view of today: everyone who has clocked in and everyone who has not.',
      ],
      features: [
        { title: 'Present today', description: 'Everyone who has clocked in, with their times.' },
        { title: 'Absent today', description: 'Everyone who has not clocked in yet — useful for a quick morning check.' },
      ],
    },
    {
      slug: 'onboarding',
      title: 'Employee Onboarding',
      icon: UserPlus,
      route: '/employee-onboarding',
      summary: 'Start onboarding for new hires and track their progress.',
      audience: ['Admin', 'HR'],
      maturity: 'preview',
      overview: [
        'Onboarding is designed to start a new hire’s journey with one form — name, email, mobile and role — and send them a personal link where they complete their details and upload documents. A tracker shows where each person is.',
      ],
      callouts: [
        { tone: 'warning', title: 'Preview', body: 'Starting onboarding and the new-hire form are simulated today: no email is sent and no documents are uploaded. The tracker shows sample data.' },
      ],
    },
    {
      slug: 'hierarchy',
      title: 'Employee Hierarchy',
      icon: Network,
      route: '/employee-hierarchy',
      summary: 'An interactive org chart of reporting lines.',
      audience: ['Everyone'],
      maturity: 'preview',
      overview: [
        'The hierarchy shows who reports to whom, with headcount, managers and levels at a glance.',
      ],
      features: [
        { title: 'Search', description: 'Type a name or role to highlight matching people.' },
        { title: 'Collapse teams', description: 'Each manager’s card shows their team size; click it to collapse or expand.' },
        { title: 'Zoom', description: 'Zoom in and out, or reset, to fit large organizations.' },
      ],
      callouts: [
        { tone: 'warning', title: 'Preview', body: 'The chart currently uses a sample organization rather than your employee records.' },
      ],
    },
    {
      slug: 'payroll',
      title: 'Payroll & payslips',
      icon: DollarSign,
      route: '/payroll',
      summary: 'HR sets each person’s monthly pay, prepares a month, checks it and publishes payslips.',
      audience: ['Everyone', 'HR', 'Admin'],
      overview: [
        'Everyone sees their own payslips here once HR publishes a month, and can print one or save it as a PDF.',
        'HR and admins set each person’s monthly pay as simple earnings and deductions, then prepare a month. Nobody sees a month until HR checks it and clicks Publish.',
      ],
      features: [
        { title: 'My payslips', description: 'Every published month, with earnings, deductions and net pay. Open one to print or save it.' },
        { title: 'People’s pay (HR and admins)', description: 'Fixed monthly components for each person — for example basic salary, allowances and deductions — in any currency.' },
        { title: 'Pay runs (HR and admins)', description: 'Prepare a month, check every payslip in a table, then publish. Drafts can be rebuilt or deleted; published months are kept as a record.' },
        { title: 'Unpaid leave', description: 'If switched on, earnings are reduced for approved unpaid leave: earnings × paid days ÷ working days.' },
      ],
      howTos: [
        {
          id: 'run-payroll',
          title: 'Pay everyone for a month (HR)',
          steps: [
            { title: 'Set people’s pay', body: 'In People’s pay, click “Set pay” next to each person and add their monthly earnings and deductions.' },
            { title: 'Prepare the month', body: 'In Pay runs, pick the month and click “Prepare payslips”.' },
            { title: 'Check it', body: 'Review the table of payslips. Fix anyone’s pay and prepare again if needed.' },
            { title: 'Publish', body: 'Click Publish. Everyone can now see their payslip.' },
          ],
        },
      ],
      callouts: [
        { tone: 'warning', title: 'No tax calculations', body: 'The app does not calculate tax or statutory deductions for any country. Enter those as fixed amounts from your payroll adviser, and follow the payroll laws where you operate.' },
        { tone: 'info', title: 'Who can see pay', body: 'Each person sees only their own payslips. Only HR and admins see everyone’s pay, and every change is recorded in the audit log.' },
      ],
    },
  ],
};
