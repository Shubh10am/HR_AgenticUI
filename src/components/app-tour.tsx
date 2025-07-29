
'use client';

import { useContext, useEffect, useState } from 'react';
import { ShepherdTourContext } from 'react-shepherd';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';

const TOUR_STORAGE_KEY = 'hrStreamlineTourCompleted';

const AppTour = () => {
  const tour = useContext(ShepherdTourContext);
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [hasTourStarted, setHasTourStarted] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    const isGuest = user?.organizationId === 'guest-org-id';

    if ((!tourCompleted || isGuest) && tour && !hasTourStarted) {
      const timer = setTimeout(() => {
        if (tour && !tour.isActive()) {
          tour.start();
          setHasTourStarted(true);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [tour, user, hasTourStarted]);

  useEffect(() => {
    const steps = [
      {
        id: 'welcome',
        title: 'Welcome to HR Streamline AI!',
        text: 'Let\'s take a quick tour of the key features. You can restart this tour anytime from the user menu.',
        buttons: [
          { text: 'Skip', action: tour?.cancel, secondary: true },
          { text: 'Next', action: tour?.next },
        ],
      },
      {
        id: 'sidebar-nav',
        title: 'Feature Modules',
        text: 'This sidebar contains all the main modules of the application. Let\'s explore a few key ones.',
        attachTo: { element: '[data-sidebar="content"]', on: 'right' },
         when: {
            show: () => { if (pathname !== '/dashboard') router.push('/dashboard'); },
        },
        buttons: [{ text: 'Next', action: tour?.next }],
      },
       {
        id: 'community',
        title: 'Community Hub',
        text: 'Connect with your team, share updates, and see company-wide announcements here.',
        attachTo: { element: 'a[href="/community"]', on: 'right' },
        when: {
            show: () => { if (pathname !== '/dashboard') router.push('/dashboard'); },
        },
        buttons: [{ text: 'Next', action: tour?.next }],
      },
      {
        id: 'recruitment',
        title: 'AI Recruitment Module',
        text: 'This module is your hub for hiring. Generate job descriptions, analyze resumes with ATS scoring, and even conduct initial AI interviews here.',
        attachTo: { element: 'a[href="/recruitment"]', on: 'right' },
        when: {
            show: () => { if (pathname !== '/dashboard') router.push('/dashboard'); },
        },
        buttons: [{ text: 'Next', action: tour?.next }],
      },
      {
        id: 'email-assistance',
        title: 'Email Assistance Module',
        text: 'Need to reply to an employee inquiry? This module uses AI to generate professional draft responses for you based on the employee\'s message.',
        attachTo: { element: 'a[href="/email-assistance"]', on: 'right' },
        when: {
            show: () => { if (pathname !== '/dashboard') router.push('/dashboard'); },
        },
        buttons: [{ text: 'Next', action: tour?.next }],
      },
      {
        id: 'attendance',
        title: 'Attendance & Reporting',
        text: 'Clock in/out, view your attendance history, and apply for leave in this section.',
        attachTo: { element: 'a[href="/attendance-reporting"]', on: 'right' },
         when: {
            show: () => { if (pathname !== '/dashboard') router.push('/dashboard'); },
        },
        buttons: [{ text: 'Next', action: tour?.next }],
      },
        {
        id: 'knowledge-base',
        title: 'Knowledge Base',
        text: 'Manage and access all your important company documents and knowledge sources here. The AI uses this for context.',
        attachTo: { element: 'a[href="/knowledge-base"]', on: 'right' },
         when: {
            show: () => { if (pathname !== '/dashboard') router.push('/dashboard'); },
        },
        buttons: [{ text: 'Next', action: tour?.next }],
      },
       {
        id: 'copilot',
        title: 'Your AI Copilot',
        text: 'Have a quick question or need help? Your AI Copilot is always available here to assist you with any task.',
        attachTo: { element: '#copilot-btn', on: 'bottom' },
        buttons: [{ text: 'Next', action: tour?.next }],
      },
      {
        id: 'user-menu',
        title: 'Your Account',
        text: 'Access your profile, settings, and logout from this menu. You can also restart this tour from here.',
        attachTo: { element: '#user-nav-btn', on: 'bottom' },
        buttons: [
          {
            text: 'Finish',
            action: () => {
              if (user?.organizationId === 'guest-org-id') {
                // Don't set for guests so they see it again if they revisit
              } else {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
              }
              tour?.complete();
            },
          },
        ],
      },
    ];

    if (tour) {
      tour.addSteps(steps);
    }
  }, [tour, pathname, router, user]);

  return null;
};

export default AppTour;
