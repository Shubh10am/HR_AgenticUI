
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, MailPlus, Inbox, CalendarCheck, MessagesSquare, GitFork, FileSignature, ListChecks, Library, Plug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DocSection {
  title: string;
  description: string;
  icon: LucideIcon;
  id: string;
}

const sections: DocSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Your central hub for a high-level overview of all HR activities, key metrics, and quick access to different modules.'
  },
  {
    id: 'email-assistance',
    title: 'Email Assistance',
    icon: MailPlus,
    description: 'An AI-powered tool that helps you generate draft responses to common employee inquiries, saving time and ensuring consistency.'
  },
  {
    id: 'gmail-inbox',
    title: 'Gmail Inbox',
    icon: Inbox,
    description: 'Directly integrate your Gmail account to manage emails within the platform, using AI to help summarize threads and draft replies.'
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: CalendarCheck,
    description: 'Manage employee attendance with clock-in/out functionality, view reports, handle leave requests, and monitor productivity.'
  },
  {
    id: 'communications',
    title: 'Communications',
    icon: MessagesSquare,
    description: 'A unified hub to aggregate communication logs from integrated platforms like Slack and Email for streamlined oversight.'
  },
  {
    id: 'recruitment',
    title: 'Recruitment',
    icon: GitFork,
    description: 'An end-to-end AI recruitment system. Generate job descriptions, filter resumes, check ATS scores, and conduct AI-powered interviews.'
  },
  {
    id: 'smart-drafting',
    title: 'Smart Drafting',
    icon: FileSignature,
    description: 'A powerful composer to write professional emails from scratch or based on AI-generated templates and prompts.'
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: ListChecks,
    description: 'A Kanban-style board to organize, assign, and track project tasks, from onboarding checklists to cross-functional projects.'
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    icon: Library,
    description: 'Create and manage a central repository of documents and company information to be used as a source for AI responses.'
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Plug,
    description: 'Connect HR Streamline AI with your favorite third-party services like Slack, GitHub, Google Calendar, and more.'
  }
];

export default function DocsPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-foreground">Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to the official documentation for HR Streamline AI. Here you'll find detailed explanations for each module of the platform.
        </p>
      </header>

      <div className="space-y-6">
        {sections.map(section => (
          <Card key={section.id} id={section.id} className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-center gap-4">
                <section.icon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{section.title}</CardTitle>
                  <CardDescription className="mt-1">{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                More detailed documentation for the <span className="font-semibold text-foreground">{section.title}</span> module is coming soon. This section will include step-by-step guides, best practices, and advanced feature explanations.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </article>
  );
}
