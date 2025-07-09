
'use client';

import { useState, useEffect, useRef, type SVGProps, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import {
  FileText,
  Users,
  BarChart3,
  MessageSquare,
  Briefcase,
  Check,
  Flag,
  Clock,
  MoreHorizontal,
  Monitor,
  ChevronRight,
  Asterisk,
  RefreshCw,
  FileSearch,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import ChatWidget from '@/components/chat-widget';

interface CustomIconProps extends SVGProps<SVGSVGElement> {}
interface CollaboratorTagProps {
  name: string;
  className?: string;
  cursorClass?: string;
  style?: React.CSSProperties;
}
interface DevCollaboratorTagProps {
  name: string;
  className?: string;
  cursorClass?: string;
  tagColorClass?: string;
  style?: React.CSSProperties;
}

interface HoverPillProps {
  icon: React.ElementType;
  label: string;
  variant?: 'light' | 'dark';
}

function CursorIcon(props: CustomIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  );
}

function FeatureFlagIcon(props: CustomIconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 3V21M6 4H16L13 8L16 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CollaboratorTag({ name, className, cursorClass, style }: CollaboratorTagProps) {
  return (
    <div className={cn("absolute flex items-center gap-2 transition-transform duration-300 hover:scale-105", className)} style={style}>
      <CursorIcon className={cn("h-6 w-6", cursorClass)} />
      <div className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-full px-4 py-1.5 text-sm">
        {name}
      </div>
    </div>
  );
}

function DevCollaboratorTag({ name, className, cursorClass, tagColorClass, style }: DevCollaboratorTagProps) {
  return (
    <div className={cn("absolute flex items-center gap-2 transition-transform duration-300 hover:scale-105", className)} style={style}>
      <CursorIcon className={cn("h-6 w-6", cursorClass)} />
      <div className={cn("border rounded-full px-4 py-1.5 text-sm font-semibold", tagColorClass)}>
        {name}
      </div>
    </div>
  );
}

function HoverPill({ icon: Icon, label, variant = 'light' }: HoverPillProps) {
  const isDark = variant === 'dark';
  return (
    <div className={cn(
      "absolute top-4 left-4 sm:top-8 sm:left-8 flex cursor-pointer items-center gap-2 rounded-full p-2 text-sm font-semibold transition-all duration-300 ease-in-out group-hover:gap-3 group-hover:pl-2 group-hover:pr-4",
      isDark
        ? "bg-white/10 text-neutral-200 group-hover:bg-white/20"
        : "bg-black/10 text-neutral-800 group-hover:bg-black/20"
    )}>
      <div className={cn(
        "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
        isDark
          ? "bg-white/10 text-neutral-300"
          : "bg-black/10 text-neutral-700"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs">
        {label}
      </span>
    </div>
  );
}

export default function LandingPage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const secureText = "SECURE";

  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = sectionsRef.current.findIndex(ref => ref === entry.target);
          if (index === -1) return;

          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(index));
          } else {
            // This ensures animations re-trigger on scroll up/down
            setVisibleSections(prev => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    const currentSections = sectionsRef.current;

    currentSections.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      currentSections.forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const WorkflowStep = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="flex flex-col items-center text-center gap-1 sm:gap-3 z-10 bg-black px-1 sm:px-2">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-600" />
      <span className="text-xs text-center sm:text-sm text-neutral-500">{label}</span>
    </div>
  );

  const tools = [
      { name: 'Monday.com', hint: 'monday com logo' },
      { name: 'ClickUp', hint: 'clickup logo' },
      { name: 'Slack', hint: 'slack logo' },
      { name: 'Asana', hint: 'asana logo' },
      { name: 'Jira', hint: 'jira logo' },
      { name: 'Trello', hint: 'trello logo' },
      { name: 'Figma', hint: 'figma logo' },
      { name: 'Notion', hint: 'notion logo' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/50 backdrop-blur-lg">
        <div className="container flex h-20 items-center justify-between mx-auto px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg text-white">HR Streamline AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-white hover:bg-neutral-800 hover:text-white hidden sm:flex">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-white text-black hover:bg-neutral-200 rounded-full">
              <Link href="/register">Try Now</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center">

        {/* HERO SECTION */}
        <section
          ref={(el) => (sectionsRef.current[0] = el)}
          className={cn(
            "container flex flex-col items-center text-center py-16 sm:py-24 md:py-32 relative group",
            visibleSections.has(0) ? "is-visible" : ""
          )}
        >
          {/* Floating tags */}
          <CollaboratorTag name="HR Admin" className="top-1/4 left-[8%] xl:left-[12%] hidden lg:flex animate-float" cursorClass="!text-cyan-400" style={{ top: '35%', left: '3%' }} />
          <CollaboratorTag name="Employee" className="top-[calc(50%-4rem)] right-[10%] xl:right-[15%] hidden lg:flex animate-float-slow" cursorClass="!text-pink-400" />

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 transition-transform duration-300 hover:scale-[1.02]">
            <span className="block opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Your creative workflow just got
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 transition-all duration-300 hover:brightness-110 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              1000x more collaborative
            </span>
          </h1>

          {/* Workflow diagram */}
          <div className="relative my-16 sm:my-24 flex w-full max-w-4xl mx-auto items-center justify-around sm:justify-between opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="absolute left-0 right-0 h-px bg-neutral-700 top-3 -z-10" />

            <WorkflowStep icon={FileText} label="Plan" />
            <WorkflowStep icon={Users} label="Recruit" />

            <div className="flex flex-col items-center gap-2 z-10 bg-black px-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="h-3 w-3 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-3 w-3 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs sm:text-sm text-neutral-500 mt-1">Onboard</span>
              <div className="mt-2 bg-gradient-to-r from-blue-400/30 via-purple-500/30 to-pink-500/30 border border-purple-400/50 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm text-purple-200">
                  HR Streamline AI
              </div>
            </div>

            <WorkflowStep icon={BarChart3} label="Report" />
          </div>

          {/* CTA Button */}
          <div className="flex justify-center gap-4 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <Button size="lg" asChild className="bg-white text-black hover:bg-neutral-200 rounded-full px-8 py-3 h-auto">
                <Link href="/register">Try Now for Free</Link>
              </Button>
          </div>
        </section>

        {/* Precision Review Section */}
        <section
          ref={(el) => (sectionsRef.current[1] = el)}
          className={cn(
            "container mx-auto py-16 sm:py-24 md:py-32 group",
            visibleSections.has(1) ? "is-visible" : ""
          )}
        >
          <div className="group relative rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6 sm:p-8 md:p-16 text-center overflow-hidden flex flex-col items-center">
             <HoverPill icon={FileSearch} label="Review" variant="dark" />

            {/* Floating elements */}
            <CollaboratorTag name="Hiring Manager" className="top-1/4 left-8 hidden lg:flex animate-float" cursorClass="transform -rotate-12 !text-cyan-400" />
            <CollaboratorTag name="Recruiter" className="bottom-1/4 right-8 hidden lg:flex animate-float-slow" cursorClass="transform rotate-[120deg] !text-pink-400" />

            <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-white transition-transform duration-300 hover:scale-[1.02] relative opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Review candidate profiles with precision
            </h2>
            <p className="text-base sm:text-lg text-blue-200 mb-8 sm:mb-12 md:mb-16 max-w-2xl mx-auto transition-colors duration-300 hover:text-blue-100 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Collaborate directly on profiles and resumes for clearer feedback and faster decisions.
            </p>

            <div className="relative max-w-2xl mx-auto border-2 border-dashed border-blue-400/50 rounded-2xl p-4 sm:p-8 min-h-[200px] sm:min-h-[250px] flex items-center justify-center opacity-0 group-[.is-visible]:animate-fade-in-up transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: '0.3s' }}>
              <div className="relative">
                <FileText className="h-20 w-20 sm:h-24 sm:w-24 text-pink-400/80" />
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <CursorIcon className="h-8 w-8 text-yellow-300 transform -rotate-45" />
                    <div className="bg-yellow-300 text-black text-sm font-semibold rounded-full px-3 py-1 shadow-md whitespace-nowrap">
                        Jane Doe (You)
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Manage, Prioritize & Assign Section */}
        <section
          ref={(el) => (sectionsRef.current[2] = el)}
          className={cn(
            "container mx-auto py-16 sm:py-24 md:py-32 group",
            visibleSections.has(2) ? "is-visible" : ""
          )}
        >
            <div className="group relative rounded-2xl bg-gradient-to-br from-yellow-200 via-yellow-300 to-amber-300 p-6 sm:p-8 md:p-16 text-center overflow-hidden flex flex-col items-center">
                <HoverPill icon={FeatureFlagIcon} label="Prioritize" />

                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/2 -translate-y-1/2 left-8 hidden lg:flex animate-float"
                    cursorClass="text-pink-500"
                    tagColorClass="bg-pink-500 text-white border-pink-500/50"
                />

                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/2 -translate-y-1/2 right-8 hidden lg:flex animate-float-slow"
                    cursorClass="text-yellow-600"
                    tagColorClass="bg-yellow-500 text-black border-yellow-600/50"
                />

                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-black transition-transform duration-300 hover:scale-[1.02] relative opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Manage, prioritize<br />& assign
                </h2>
                <p className="text-base sm:text-lg text-neutral-700 mb-8 sm:mb-12 md:mb-16 max-w-2xl mx-auto transition-colors duration-300 hover:text-neutral-600 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Use our built-in task manager or integrate your own.
                </p>

                {/* Mock Task Card */}
                <div className="relative max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-4 text-left text-black opacity-0 group-[.is-visible]:animate-fade-in-up transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
                                <Flag className="h-3 w-3 mr-1.5"/> PO
                            </Badge>
                             <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1.5"/> In Progress
                            </Badge>
                            <Badge variant="secondary">#Question</Badge>
                        </div>
                        <MoreHorizontal className="h-5 w-5 text-neutral-400" />
                    </div>

                    <div className="flex items-start gap-3">
                        <Image
                            src="https://randomuser.me/api/portraits/men/75.jpg"
                            alt="Calvin F."
                            width={32}
                            height={32}
                            className="rounded-full"
                            data-ai-hint="man face"
                        />
                        <div className="flex-1">
                            <div className="flex items-center text-sm">
                                <span className="font-semibold">Calvin F.</span>
                                <span className="text-neutral-500 ml-2">3h</span>
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full ml-2"></div>
                            </div>
                            <p className="text-xs text-neutral-500">
                                Assigned to <span className="text-blue-600 font-medium">@You</span>
                            </p>
                            <p className="my-2 text-neutral-800">
                                Let's add a sun here, <span className="text-blue-600">@felix</span>
                            </p>

                            <div className="flex items-center justify-between text-xs text-neutral-500 mt-3">
                                <button className="flex items-center gap-1 hover:text-blue-600">
                                    <MessageSquare className="h-4 w-4" /> 2 Replies
                                </button>
                                <div className="flex items-center gap-2">
                                    <Monitor className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Get Approvals at Hyper Speed Section */}
        <section
          ref={(el) => (sectionsRef.current[3] = el)}
          className={cn(
            "container mx-auto py-16 sm:py-24 md:py-32 group",
            visibleSections.has(3) ? "is-visible" : ""
          )}
        >
            <div className="group relative rounded-2xl bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-200 p-6 sm:p-8 md:p-16 text-center overflow-hidden flex flex-col items-center">
                <HoverPill icon={Check} label="Approve" />

                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/4 left-12 hidden lg:flex animate-float"
                    cursorClass="text-lime-500"
                    tagColorClass="bg-lime-300 text-lime-900 font-bold border-lime-400"
                />

                <DevCollaboratorTag
                    name="Developer"
                    className="bottom-1/4 right-12 hidden lg:flex animate-float-slow"
                    cursorClass="text-pink-500"
                    tagColorClass="bg-pink-400 text-white font-bold border-pink-500"
                />

                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-black transition-transform duration-300 hover:scale-[1.02] relative opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Get approvals<br />at hyper speed
                </h2>
                <p className="text-base sm:text-lg text-neutral-700 mb-8 sm:mb-12 md:mb-16 max-w-2xl mx-auto transition-colors duration-300 hover:text-neutral-600 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Built-in approvals for less back-and-forth-ing
                </p>

                <div className="relative max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-black opacity-0 group-[.is-visible]:animate-fade-in-up transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: '0.3s' }}>
                <div className="relative inline-block mb-4">
                    <Image
                    src="https://randomuser.me/api/portraits/men/78.jpg"
                    alt="Mike Mulligan"
                    width={80}
                    height={80}
                    className="rounded-full w-16 h-16 sm:w-20 sm:h-20 object-cover"
                    data-ai-hint="man face"
                    />
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white">
                    <Check className="h-4 w-4 text-white" />
                    </div>
                </div>
                <p className="text-lg sm:text-xl font-semibold">File was approved</p>
                <p className="text-lg sm:text-xl font-semibold">by Mike Mulligan</p>
                <p className="text-sm text-neutral-500 mt-2">on 24th August 2023</p>
                <p className="font-serif italic text-xl sm:text-2xl text-neutral-600 mt-6">
                    Mike Mulligan
                </p>
                </div>
            </div>
        </section>

        {/* Sync With Your Tools Section */}
        <section
          ref={(el) => (sectionsRef.current[4] = el)}
          className={cn(
            "container mx-auto py-16 sm:py-24 md:py-32 group",
            visibleSections.has(4) ? "is-visible" : ""
          )}
        >
            <div className="group relative rounded-2xl bg-gradient-to-br from-rose-100 via-pink-100 to-red-100 p-6 sm:p-8 md:p-16 text-center overflow-hidden flex flex-col items-center">
                <HoverPill icon={RefreshCw} label="Sync" />

                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/4 left-12 hidden lg:flex animate-float"
                    cursorClass="text-orange-500"
                    tagColorClass="bg-orange-300 text-orange-900 font-bold border-orange-400"
                />
                <DevCollaboratorTag
                    name="Developer"
                    className="bottom-1/4 right-12 hidden lg:flex animate-float-slow"
                    cursorClass="text-yellow-500"
                    tagColorClass="bg-yellow-300 text-yellow-900 font-bold border-yellow-400"
                />

                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-black transition-transform duration-300 hover:scale-[1.02] relative opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Sync with<br />your tools
                </h2>
                <p className="text-base sm:text-lg text-neutral-700 mb-8 sm:mb-12 max-w-2xl mx-auto transition-colors duration-300 hover:text-neutral-600 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Seamlessly integrate your Slack or favorite task manager
                </p>

                <div className="relative w-full max-w-4xl mx-auto overflow-hidden mt-12 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className="flex animate-marquee">
                        {[...tools, ...tools].map((tool, index) => (
                            <div key={`${tool.name}-${index}`} className="flex-shrink-0 flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md text-black mx-4">
                                <Image src={`https://placehold.co/24x24.png`} width={24} height={24} alt={`${tool.name} logo`} data-ai-hint={tool.hint} />
                                <span className="font-semibold text-sm md:text-base">{tool.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Link href="/integrations" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-black mt-12 sm:mt-16 group opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    VIEW INTEGRATIONS
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </section>

        {/* Reviews in Slow Motion Section */}
        <section
          ref={(el) => (sectionsRef.current[6] = el)}
          className={cn(
            "container mx-auto py-16 sm:py-24 md:py-32 group",
            visibleSections.has(6) ? "is-visible" : ""
          )}
        >
          <div className="relative rounded-2xl bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 p-6 sm:p-8 md:p-16 text-center overflow-hidden min-h-[550px] sm:min-h-[600px] flex flex-col justify-center items-center">
            
            {/* Cursor + Spinning Wheel */}
            <div className="absolute top-[20%] sm:top-1/4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <CursorIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,#F59E0B_0%,#EF4444_25%,#8B5CF6_50%,#3B82F6_75%,#4ADE80_100%)] animate-slow-spin"></div>
            </div>

            {/* Text Content */}
            <div className="relative z-10 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 text-black">
                Reviews can move
                <br />
                in slow motio<span className="opacity-80">n</span><span className="opacity-60">n</span><span className="opacity-40">n</span>
              </h2>
              <p className="text-base sm:text-lg text-neutral-800 max-w-md mx-auto">
                Screenshots are for memes. Not precise and efficient review process
              </p>
            </div>

            {/* Tooltip and Icon Bar */}
            <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative bg-neutral-900 text-white rounded-lg px-4 py-2 mb-3 shadow-lg">
                <p className="text-sm text-center">
                  You are using <span className="font-bold">more than 6 tools</span> to review
                </p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-900 transform rotate-45" style={{ zIndex: -1 }}></div>
              </div>
              <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-2xl px-4 py-3 flex items-center justify-center gap-4 sm:gap-5 shadow-2xl">
                <Image src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" width={28} height={28} alt="Gmail logo" data-ai-hint="gmail logo" className="h-6 w-6 sm:h-7 sm:w-7 opacity-90 hover:opacity-100 transition-opacity" />
                <Image src="https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png" width={28} height={28} alt="Slack logo" data-ai-hint="slack logo" className="h-6 w-6 sm:h-7 sm:w-7 opacity-90 hover:opacity-100 transition-opacity" />
                <Image src="https://cdn.icon-icons.com/icons2/2699/PNG/512/atlassian_logo_icon_170544.png" width={28} height={28} alt="Atlassian logo" data-ai-hint="atlassian jira logo" className="h-6 w-6 sm:h-7 sm:w-7 opacity-90 hover:opacity-100 transition-opacity" />
                <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/2203px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png" width={28} height={28} alt="Microsoft Teams logo" data-ai-hint="microsoft teams logo" className="h-6 w-6 sm:h-7 sm:w-7 opacity-90 hover:opacity-100 transition-opacity" />
                <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a8/Google_Chrome_icon_%28send_to_phone%29.svg" width={28} height={28} alt="Chrome logo" data-ai-hint="chrome browser logo" className="h-6 w-6 sm:h-7 sm:w-7 opacity-90 hover:opacity-100 transition-opacity" />
              </div>
            </div>

          </div>
        </section>


        {/* Super Secure Section */}
        <section
          ref={(el) => (sectionsRef.current[5] = el)}
          className={cn(
            "bg-white text-black py-16 sm:py-24 md:py-32 group",
            visibleSections.has(5) ? "is-visible" : ""
          )}
        >
          <div className="container mx-auto px-4 sm:px-6">
            <div className="p-1.5 rounded-[30px] sm:rounded-[40px] bg-gradient-to-br from-blue-300 to-purple-400">
              <div className="p-1.5 rounded-[25px] sm:rounded-[35px] bg-white">
                <div className="p-1.5 rounded-[20px] sm:rounded-[30px] bg-gradient-to-br from-blue-200/50 to-purple-300/50">
                  <div className="bg-white rounded-[15px] sm:rounded-[25px] p-6 sm:p-8 md:p-16 text-center flex flex-col items-center">

                    <div className="flex justify-center items-center flex-wrap gap-1.5 sm:gap-3 mb-8" onMouseLeave={() => setHoveredIndex(null)}>
                      {secureText.split('').map((letter, index) => (
                        <div
                          key={index}
                          onMouseEnter={() => setHoveredIndex(index)}
                          className="bg-purple-100 border border-purple-200 rounded-lg p-1 sm:p-2 cursor-default transition-all duration-300 flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8"
                        >
                          {hoveredIndex === index ? (
                            <span className="font-bold text-purple-600 text-lg opacity-0 group-[.is-visible]:animate-fade-in-up">{letter}</span>
                          ) : (
                            <Asterisk className="h-4 w-4 text-purple-500" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-neutral-800 transition-transform duration-300 hover:scale-[1.02]">
                        Super secure with
                      </h2>
                      <p className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-8 sm:mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 hover:brightness-110">
                        SOCII Type I Compliance
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-y-4 sm:gap-y-0 gap-x-6 sm:gap-x-12 text-neutral-600 opacity-0 group-[.is-visible]:animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <div className="flex items-center gap-2 transition-transform hover:scale-105">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>End-to-End data encryption</span>
                      </div>
                      <div className="flex items-center gap-2 transition-transform hover:scale-105">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>Dedicated Storage</span>
                      </div>
                      <div className="flex items-center gap-2 transition-transform hover:scale-105">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>SOC2 Compliant</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="container py-6 text-center text-sm text-neutral-500 px-4 sm:px-6">
          © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
        </div>
      </footer>

      {/* Floating Chat Button */}
      <ChatWidget />
    </div>
  );
}
