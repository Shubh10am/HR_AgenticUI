
'use client';

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Mail, Users, FileText, MessageSquare, ListChecks, CalendarDays, GitFork, BarChart3, Plug, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  label?: string;
}

const WELCOME_PART = "Welcome to ";
const HR_AI_PART = "HR Streamline AI";
const TYPING_SPEED_MS = 100;
const PAUSE_DURATION_MS = 2000;
const RESET_DELAY_MS = 50;


export default function DashboardPage() {
  const { toast } = useToast();

  const [animatedWelcomeText, setAnimatedWelcomeText] = useState('');
  const [animatedHrText, setAnimatedHrText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'typingWelcome' | 'typingHr' | 'pausing' | 'resetting'>('typingWelcome');


  useEffect(() => {
    let timer: NodeJS.Timeout;

    switch (currentPhase) {
      case 'typingWelcome':
        if (currentIndex < WELCOME_PART.length) {
          timer = setTimeout(() => {
            setAnimatedWelcomeText(prev => prev + WELCOME_PART[currentIndex]);
            setCurrentIndex(prev => prev + 1);
          }, TYPING_SPEED_MS);
        } else {
          setCurrentIndex(0); // Reset index for HR_AI_PART
          setCurrentPhase('typingHr');
        }
        break;
      case 'typingHr':
        if (currentIndex < HR_AI_PART.length) {
          timer = setTimeout(() => {
            setAnimatedHrText(prev => prev + HR_AI_PART[currentIndex]);
            setCurrentIndex(prev => prev + 1);
          }, TYPING_SPEED_MS);
        } else {
          setCurrentPhase('pausing');
        }
        break;
      case 'pausing':
        timer = setTimeout(() => {
          setCurrentPhase('resetting');
        }, PAUSE_DURATION_MS);
        break;
      case 'resetting':
        setAnimatedWelcomeText('');
        setAnimatedHrText('');
        setCurrentIndex(0);
        timer = setTimeout(() => {
          setCurrentPhase('typingWelcome');
        }, RESET_DELAY_MS);
        break;
    }

    return () => clearTimeout(timer);
  }, [currentIndex, currentPhase]);

  const animatedPageTitle: ReactNode = (
    <>
      {animatedWelcomeText}
      {(currentPhase === 'typingHr' || currentPhase === 'pausing' || (currentPhase === 'resetting' && animatedHrText.length > 0) || (currentPhase === 'typingWelcome' && animatedWelcomeText === WELCOME_PART && animatedHrText === HR_AI_PART) ) && (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]">
          {animatedHrText || (currentPhase === 'typingWelcome' && animatedWelcomeText === WELCOME_PART ? HR_AI_PART : '')} 
        </span>
      )}
    </>
  );


  const quickActions: QuickAction[] = [
    { title: 'Email Assistance', description: 'AI-powered help for inquiries.', href: '/email-assistance', icon: Mail },
    { title: 'Recruitment Hub', description: 'Streamline hiring with AI tools.', href: '/recruitment', icon: GitFork },
    { title: 'Tasks', description: 'Organize and track project tasks.', href: '/tasks', icon: ListChecks },
    { title: 'Smart Drafting', description: 'Generate emails from prompts.', href: '/smart-drafting', icon: FileText },
    { title: 'Unified Comms', description: 'Aggregated communication logs.', href: '/unified-communications', icon: MessageSquare },
    { title: 'Attendance', description: 'Clock in/out and view reports.', href: '/attendance-reporting', icon: CalendarDays },
    { title: 'Integrations', description: 'Connect to other services.', href: '/integrations', icon: Plug },
  ];
  

  return (
    <>
      <PageHeader
        title={animatedPageTitle}
        titleClassName="text-3xl sm:text-4xl md:text-5xl lg:text-6xl min-h-[1.2em]" // Added min-h to reduce layout shift
        description="Your intelligent assistant for efficient HR operations."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.href} className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground pt-1">{action.description}</CardDescription>
              </div>
              <action.icon className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" size="sm" className="w-full group mt-2">
                <Link href={action.href}>
                  Go to {action.label || action.title.split(' ')[0]}
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                    <Briefcase className="mr-2 h-6 w-6 text-primary" />
                    HR Operations Overview
                </CardTitle>
            </div>
            <CardDescription>Key metrics and summaries of HR activities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-secondary/30 p-4 rounded-lg">
                <CardTitle className="text-base">Active Recruitment Campaigns</CardTitle>
                <p className="text-3xl font-bold text-primary">3</p>
                <p className="text-xs text-muted-foreground">View details in Recruitment Hub</p>
              </Card>
              <Card className="bg-secondary/30 p-4 rounded-lg">
                <CardTitle className="text-base">Pending Leave Approvals</CardTitle>
                <p className="text-3xl font-bold text-primary">5</p>
                <p className="text-xs text-muted-foreground">Process in Attendance Module (Mock)</p>
              </Card>
               <Card className="bg-secondary/30 p-4 rounded-lg">
                <CardTitle className="text-base">Emails Awaiting Response</CardTitle>
                <p className="text-3xl font-bold text-primary">12</p>
                <p className="text-xs text-muted-foreground">Check Gmail Inbox or Email Assistance</p>
              </Card>
               <Card className="bg-secondary/30 p-4 rounded-lg">
                <CardTitle className="text-base">Open Tasks This Week</CardTitle>
                <p className="text-3xl font-bold text-primary">8</p>
                <p className="text-xs text-muted-foreground">Go to Task Management</p>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-6 w-6 text-primary"/>
                System Status
            </CardTitle>
            <CardDescription>Current status of integrated services.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span>Email Integration</span>
                <Badge variant="default" className="bg-green-500 text-white">Operational</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Slack Integration</span>
                <Badge variant="default" className="bg-green-500 text-white">Operational</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>AI Services</span>
                <Badge variant="default" className="bg-green-500 text-white">Operational</Badge>
              </li>
               <li className="flex items-center justify-between">
                <span>Database Connectivity</span>
                 <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Degraded</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .bg-gradient-to-r.from-\\[hsl\\(var\\(--primary\\))\\].to-\\[hsl\\(var\\(--accent\\))\\] {
          background-image: linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)));
        }
      `}</style>
    </>
  );
}
