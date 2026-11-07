import { CalendarClock, CheckSquare, DoorOpen, FileText, Laptop, Palmtree, PieChart, Receipt, Timer } from 'lucide-react';
import type { DocSection } from './types';

export const everydayHr: DocSection = {
  id: 'everyday-hr',
  title: 'Everyday HR',
  description: 'Requests, approvals, time off, time tracking, equipment, documents, exits and reports.',
  pages: [
    {
      slug: 'approvals',
      title: 'Approvals',
      icon: CheckSquare,
      route: '/approvals',
      summary: 'One inbox for every request that needs a yes or no: leave, expenses, timesheets and resignations.',
      audience: ['Everyone'],
      overview: [
        'When someone asks for leave, claims an expense, submits a timesheet or resigns, the request goes through a short chain of approvers — usually their manager, then HR. Every request that is waiting on you appears here.',
        'Each request shows a timeline, so everyone can see who has approved it and who it is waiting on.',
      ],
      features: [
        { title: 'Waiting on me', description: 'Requests where you are the next approver.' },
        { title: 'My requests', description: 'Everything you have asked for and where it is.' },
        { title: 'Decided', description: 'Requests you have already approved or rejected.' },
        { title: 'All open (HR and admins)', description: 'Every open request in the organization, so nothing gets stuck.' },
        { title: 'Approval rules', description: 'HR and admins choose the approvers for each kind of request, and can add a step only for large amounts.' },
      ],
      howTos: [
        {
          id: 'approve-request',
          title: 'Approve or reject a request',
          steps: [
            { title: 'Open Approvals', body: 'The “Waiting on me” tab lists what needs you.' },
            { title: 'Check the details', body: 'Read the summary and the timeline of earlier steps.' },
            { title: 'Decide', body: 'Click Approve, or Reject and write a short reason — the reason is shown to the person who asked.' },
          ],
        },
      ],
      callouts: [{ tone: 'info', title: 'No self-approval', body: 'Nobody can approve their own request. If a manager is away, an admin can step in from the All open tab.' }],
    },
    {
      slug: 'leave',
      title: 'Leave',
      icon: Palmtree,
      route: '/leave',
      summary: 'Your leave balances, requests, the team calendar and the holiday list.',
      audience: ['Everyone'],
      overview: [
        'Leave shows how many days you have left of each leave type, lets you request time off, and shows who is away this month so you can plan around it.',
        'Weekends and company holidays are not counted, so a request for Friday to Monday uses two days.',
      ],
      features: [
        { title: 'Balances', description: 'Days earned, carried over from last year, taken and pending. New joiners earn leave from their joining date.' },
        { title: 'Request leave', description: 'Pick the type and dates; the request goes to your approvers. You can withdraw it while it is pending, or before it starts.' },
        { title: 'Who’s away', description: 'A month calendar of colleagues on leave. It shows that someone is away, never the type of leave.' },
        { title: 'Holidays', description: 'The year’s company holidays, including optional ones. HR adds and removes them.' },
        { title: 'Policy (HR and admins)', description: 'Set the yearly allowance and carry-over for each leave type.' },
      ],
      howTos: [
        {
          id: 'request-leave',
          title: 'Request time off',
          steps: [
            { title: 'Click “Request leave”', body: 'At the top right of the Leave page.' },
            { title: 'Choose type and dates', body: 'You will see how many working days it uses and your balance afterwards.' },
            { title: 'Send', body: 'Follow its progress under My requests or in Approvals.' },
          ],
        },
      ],
      callouts: [
        { tone: 'warning', title: 'Keep medical details private', body: 'You never need to write medical details in a leave note. Share anything sensitive directly with HR if your policy requires it.' },
        { tone: 'info', title: 'Statutory leave', body: 'Leave types set by law (for example parental leave) start with no limit. HR should set them to match the law where you work.' },
      ],
    },
    {
      slug: 'timesheets',
      title: 'Timesheets',
      icon: Timer,
      route: '/timesheets',
      summary: 'Log hours against projects each week and send them for approval.',
      audience: ['Everyone'],
      overview: ['Fill in a simple week grid — projects down the side, days across the top — then submit the week. Your manager approves it in Approvals.'],
      features: [
        { title: 'Weekly grid', description: 'Hours in quarter-hour steps, with an optional note per entry. Save as you go.' },
        { title: 'Submit and withdraw', description: 'Submitted weeks are locked. Withdraw a week to change it; a rejected week opens again for editing.' },
        { title: 'Projects (HR and admins)', description: 'Add projects with a client and code, and mark them billable or not.' },
        { title: 'Report', description: 'Hours by project and by person for any date range. Managers see their team; HR and admins see everyone.' },
      ],
      howTos: [
        {
          id: 'submit-week',
          title: 'Submit your week',
          steps: [
            { title: 'Add a row per project', body: 'Choose the project, then type hours under each day.' },
            { title: 'Save', body: 'Your hours are kept even if you leave the page.' },
            { title: 'Submit week', body: 'It goes to your manager for approval.' },
          ],
        },
      ],
    },
    {
      slug: 'shifts',
      title: 'Shifts',
      icon: CalendarClock,
      route: '/shifts',
      summary: 'Define working hours and weekly days off, assign people and see the roster.',
      audience: ['Admin', 'HR', 'Everyone'],
      overview: [
        'A shift sets someone’s start and end time, a grace period before they count as late, and their weekly days off. Attendance uses each person’s shift, so an evening-shift colleague is not marked late at 10 a.m.',
      ],
      features: [
        { title: 'Shift types', description: 'Name, hours, grace minutes, weekly off days and a colour.' },
        { title: 'Assign', description: 'Put people on a shift from a date. Anyone without a shift uses the standard working day.' },
        { title: 'Roster', description: 'A week view of who works which shift, with leave shown simply as “Away”.' },
      ],
    },
    {
      slug: 'expenses',
      title: 'Expenses',
      icon: Receipt,
      route: '/expenses',
      summary: 'Claim work expenses with a receipt and follow them to payment.',
      audience: ['Everyone'],
      overview: ['Add an expense with the amount, category, date and a photo or PDF of the receipt. It goes for approval, and HR marks it paid once reimbursed.'],
      features: [
        { title: 'Claims', description: 'Status for each claim: submitted, approved, rejected or paid.' },
        { title: 'Receipts', description: 'Attach the receipt so approvers can check it.' },
        { title: 'Larger amounts', description: 'Approval rules can add an extra step for claims over a set amount.' },
      ],
    },
    {
      slug: 'assets',
      title: 'Assets',
      icon: Laptop,
      route: '/assets',
      summary: 'Track company equipment: who has which laptop, phone or ID card.',
      audience: ['Everyone', 'HR', 'Admin'],
      overview: ['Everyone sees the equipment they hold. HR and admins keep the full register: add items, assign or return them, and send them for repair or retire them. Each item keeps its history.'],
      features: [
        { title: 'My equipment', description: 'What is assigned to you, and since when.' },
        { title: 'Register', description: 'Search all equipment by tag, name or holder, filtered by status.' },
        { title: 'Exit check', description: 'When someone leaves, their exit page lists equipment they still need to return.' },
      ],
    },
    {
      slug: 'documents',
      title: 'Documents',
      icon: FileText,
      route: '/documents',
      summary: 'Company policies to read and sign, and letters you can request.',
      audience: ['Everyone'],
      overview: [
        'Policies: HR publishes a policy and everyone confirms they have read it by typing their name. If the text changes, it becomes a new version and people sign again.',
        'Letters: request an employment or experience letter. It is filled in from your work details only, and you can print or save it as a PDF.',
      ],
      features: [
        { title: 'To sign', description: 'Policies waiting for your signature appear first.' },
        { title: 'Sign-off tracking', description: 'HR sees who has and hasn’t signed each version.' },
        { title: 'Letters', description: 'Generated from job title, department and dates — no personal or salary details.' },
      ],
    },
    {
      slug: 'offboarding',
      title: 'Offboarding',
      icon: DoorOpen,
      route: '/offboarding',
      summary: 'Resign, or manage an exit, with a shared checklist and a confidential exit interview.',
      audience: ['Everyone', 'Manager', 'HR'],
      overview: [
        'An employee can resign here; the resignation goes for approval. HR can also start an exit for someone. Each exit has a checklist split between the employee, their manager, IT and HR, and finishes when every item is done.',
      ],
      features: [
        { title: 'Checklist', description: 'Handover, equipment return, access removal, final settlement and more — each item has an owner.' },
        { title: 'Last working day', description: 'Defaults to the notice period; the manager or HR can change it.' },
        { title: 'Exit interview', description: 'The leaver’s feedback is visible only to HR and admins — not to their manager.' },
      ],
    },
    {
      slug: 'reports',
      title: 'People reports',
      icon: PieChart,
      route: '/reports',
      summary: 'Headcount, joiners and leavers, attrition, leave, expenses and training at a glance.',
      audience: ['Admin', 'HR'],
      overview: [
        'Reports bring the numbers from every module into one page, updated each time you open it. Everything is a total — nobody is named.',
        'To protect privacy, small groups are combined: leave types taken by fewer than five people, and exit reasons given by only one person, are shown as “Other”.',
      ],
      features: [
        { title: 'Headline figures', description: 'Headcount, attrition over 12 months, leave days taken this year and open approvals.' },
        { title: 'Joiners and leavers', description: 'A month-by-month chart for the last year.' },
        { title: 'Breakdowns', description: 'Headcount by department and role, why people left, leave by type and approved expenses by category.' },
        { title: 'Training', description: 'The share of mandatory courses completed.' },
      ],
      callouts: [{ tone: 'tip', title: 'Reading attrition', body: 'Attrition is leavers in the last 12 months divided by average headcount. In a small team one leaver moves it a lot, so read it alongside the chart.' }],
    },
  ],
};
