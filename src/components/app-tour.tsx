'use client';

import { useContext, useEffect } from 'react';
import { ShepherdTourContext } from 'react-shepherd';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';

const MAIN_TOUR_STORAGE_KEY = 'hrStreamlineTourCompleted';
const ADMIN_TOUR_STORAGE_KEY = 'hrStreamlineAdminTourCompleted';

const appModules = [
  { id: 'dashboard', title: 'Dashboard', text: 'Get a quick overview of HR activity, open tasks, and system status.' },
  { id: 'community', title: 'Community', text: 'Share company updates and connect with your team.' },
  { id: 'email-assistance', title: 'Email Assistance', text: 'Draft helpful replies to employee questions with AI support.' },
  { id: 'gmail-inbox', title: 'Gmail Inbox', text: 'Review and manage messages from your connected Gmail inbox.' },
  { id: 'my-attendance', title: 'My Attendance', text: 'Review attendance, clock in or out, and submit leave requests.' },
  { id: 'payroll', title: 'Payroll', text: 'Open payroll tools and review compensation workflows.' },
  { id: 'tasks', title: 'Tasks', text: 'Move tickets between workflow columns, reorder them, or open a ticket to edit its details and add comments.' },
  { id: 'communications', title: 'Communications', text: 'Review communication activity across the connected channels.' },
  { id: 'recruitment', title: 'Recruitment', text: 'Create job descriptions, review candidates, and use AI hiring tools.' },
  { id: 'smart-drafting', title: 'Smart Drafting', text: 'Turn a short prompt into a polished email draft.' },
  { id: 'onboarding', title: 'Employee Onboarding', text: 'Start and track the employee onboarding workflow.' , adminOnly: true },
  { id: 'knowledge-base', title: 'Knowledge Base', text: 'Organize company documents and reference materials for your team.' },
  { id: 'manage-employees', title: 'Manage Employees', text: 'Create, review, and update employee records.' , adminOnly: true },
  { id: 'employee-hierarchy', title: 'Employee Hierarchy', text: 'Browse the reporting structure across your organization.' },
  { id: 'attendance-mgmt', title: 'Attendance Management', text: 'Manage attendance records and team-level attendance workflows.' , adminOnly: true },
  { id: 'integrations', title: 'Integrations', text: 'Connect the services used by your HR workflows.' },
  { id: 'support', title: 'Get Support', text: 'Open a support request or find help with the app.' },
];

const adminModules = [
  { id: 'admin-dashboard', title: 'Admin Dashboard', text: 'View platform-wide activity and important operational signals.' },
  { id: 'admin-analytics', title: 'Analytics', text: 'Review platform usage and organization metrics.' },
  { id: 'admin-users', title: 'User Management', text: 'Manage platform administrator accounts.' },
  { id: 'admin-organizations', title: 'Organizations', text: 'Review customer organizations and their status.' },
  { id: 'admin-inquiries', title: 'Customer Inquiries', text: 'Review questions submitted by customers.' },
  { id: 'admin-community', title: 'Community Posts', text: 'Moderate and manage community content.' },
  { id: 'admin-support', title: 'Support Tickets', text: 'Review and respond to customer support tickets.' },
  { id: 'admin-content', title: 'Content Management', text: 'Manage the content shown across the product.' },
  { id: 'admin-system-health', title: 'System Health', text: 'Review service health and operational logs.' },
  { id: 'admin-settings', title: 'System Settings', text: 'Configure platform-wide settings.' },
  { id: 'admin-back-to-app', title: 'Back to the HR app', text: 'Use this shortcut to return to the main HR workspace.' },
];

const AppTour = () => {
  const tour = useContext(ShepherdTourContext);
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdminTour = pathname.startsWith('/admin');

  useEffect(() => {
    if (!user || !tour || tour.steps.length > 0) return;

    const canSeeAdminModules = user.role === 'Admin' || user.role === 'HR';
    const modules = isAdminTour
      ? adminModules
      : appModules.filter((module) => !('adminOnly' in module && module.adminOnly) || canSeeAdminModules);
    const completionKey = isAdminTour ? ADMIN_TOUR_STORAGE_KEY : MAIN_TOUR_STORAGE_KEY;

    const markTourComplete = () => {
      window.localStorage.setItem(completionKey, 'true');
    };

    const skipTour = () => {
      markTourComplete();
      tour.cancel();
    };

    const finishTour = () => {
      markTourComplete();
      tour.complete();
    };

    const clearTourHighlight = () => {
      document.querySelectorAll('.shepherd-tour-highlight').forEach((element) => {
        element.classList.remove('shepherd-tour-highlight');
      });
    };

    const highlightTarget = (selector: string) => () => {
      clearTourHighlight();
      document.querySelector(selector)?.classList.add('shepherd-tour-highlight');
    };

    const welcomeStep = {
      id: isAdminTour ? 'admin-tour-welcome' : 'app-tour-welcome',
      title: isAdminTour ? 'Welcome to Admin' : 'Welcome to HR Streamline AI',
      text: 'Take a guided look at every section. Each step points to the place it describes. Use Back or Next to move at your own pace.',
      classes: 'app-tour-step',
      buttons: [
        { text: 'Skip tour', action: skipTour, secondary: true },
        { text: 'Start tour', action: () => tour.next() },
      ],
    };

    const featureSteps = modules.map((module, index) => ({
      id: `tour-${module.id}`,
      title: `${index + 1} of ${modules.length} · ${module.title}`,
      text: module.text,
      attachTo: { element: `[data-tour-id="${module.id}"]`, on: 'right' as const },
      classes: 'app-tour-step',
      scrollTo: { behavior: 'smooth' as const, block: 'nearest' as const },
      when: {
        show: highlightTarget(`[data-tour-id="${module.id}"]`),
        hide: clearTourHighlight,
      },
      buttons: [
        { text: 'Back', action: () => tour.back(), secondary: true },
        { text: 'Skip tour', action: skipTour, secondary: true },
        { text: index === modules.length - 1 && isAdminTour ? 'Continue' : 'Next', action: () => tour.next() },
      ],
    }));

    const topBarSteps = isAdminTour ? [] : [
      {
        id: 'tour-copilot',
        title: 'AI Copilot',
        text: 'Open the copilot for a quick answer or help with a task from anywhere in the app.',
        attachTo: { element: '#copilot-btn', on: 'bottom' as const },
        classes: 'app-tour-step',
        when: {
          show: highlightTarget('#copilot-btn'),
          hide: clearTourHighlight,
        },
        buttons: [
          { text: 'Back', action: () => tour.back(), secondary: true },
          { text: 'Skip tour', action: skipTour, secondary: true },
          { text: 'Next', action: () => tour.next() },
        ],
      },
    ];

    const accountStep = {
      id: 'tour-account-menu',
      title: 'Account and preferences',
      text: 'Open your profile, settings, theme, and sign-out options here. You can restart this tour from the same menu.',
      attachTo: { element: '#user-nav-btn', on: 'bottom' as const },
      classes: 'app-tour-step',
      when: {
        show: highlightTarget('#user-nav-btn'),
        hide: clearTourHighlight,
      },
      buttons: [
        { text: 'Back', action: () => tour.back(), secondary: true },
        { text: 'Finish tour', action: finishTour },
      ],
    };

    tour.addSteps([welcomeStep, ...featureSteps, ...topBarSteps, accountStep]);
  }, [tour, user, isAdminTour]);

  useEffect(() => {
    if (!user || !tour || tour.steps.length === 0) return;

    const isDashboard = pathname === '/dashboard' || pathname === '/admin/dashboard';
    if (!isDashboard || tour.isActive()) return;

    const completionKey = pathname.startsWith('/admin') ? ADMIN_TOUR_STORAGE_KEY : MAIN_TOUR_STORAGE_KEY;
    const tourCompleted = window.localStorage.getItem(completionKey);
    const shouldShowTour = !tourCompleted;

    if (!shouldShowTour) return;

    const timer = window.setTimeout(() => {
      if (!tour.isActive()) tour.start();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [tour, user, pathname]);

  return null;
};

export default AppTour;
