
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import type { SVGProps, ReactNode } from 'react';
import { FileText, Users, BarChart3, MessageSquare, Play, PlayCircle, Briefcase, Mail, FileJson, FileImage, FileSignature as FileSignatureIcon, Globe, UserCheck, Slack, Zoom, Check, Flag, Clock, MoreHorizontal, Monitor, CheckCircle, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';


// A simple cursor icon to match the design
const CursorIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
  </svg>
);

const features = [
  { name: 'Resumes', icon: FileText, color: 'text-sky-400' },
  { name: 'Interviews', icon: PlayCircle, color: 'text-green-400' },
  { name: 'Onboarding', icon: Users, color: 'text-amber-400' },
  { name: 'Reports', icon: BarChart3, color: 'text-rose-400' },
  { name: 'Job Descriptions', icon: Briefcase, color: 'text-indigo-400' },
  { name: 'Emails', icon: Mail, color: 'text-emerald-400' },
];

// Abstract icons for the "Eliminate Redundant Tools" section
const Icon1 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#FCA5A5"/><circle cx="20" cy="20" r="6" fill="#DC2626"/></svg>;
const Icon2 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="10" fill="#818CF8"/><path d="M13 20H27" stroke="white" strokeWidth="3" strokeLinecap="round"/><path d="M20 13L20 27" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>;
const Icon3 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="20" height="20" rx="10" fill="#60A5FA"/><path d="M16 20L20 24L25 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Icon4 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L27.5 12.5L20 25L12.5 12.5L20 0Z" fill="#FCD34D"/><path d="M20 15L27.5 27.5L20 40L12.5 27.5L20 15Z" fill="#FBBF24"/></svg>;
const Icon5 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5L35 20L20 35L5 20L20 5Z" fill="#A78BFA"/><path d="M20 12L28 20L20 28L12 20L20 12Z" fill="white"/></svg>;
const Icon6 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#4ADE80"/><circle cx="15" cy="15" r="4" fill="white"/><circle cx="25" cy="25" r="4" fill="white"/></svg>;

const abstractIcons = [Icon1, Icon2, Icon3, Icon4, Icon5, Icon6];

const AssetIcon = ({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: React.ElementType;
  className?: string;
  iconClassName?: string;
}) => (
  <div
    className={cn(
      'relative flex h-24 w-20 items-center justify-center rounded-2xl border bg-white shadow-lg',
      className
    )}
  >
    <Icon className={cn('h-9 w-9', iconClassName)} />
  </div>
);

const CollaboratorTag = ({ name, className, cursorClass, ...props }: { name: string; className?: string; cursorClass?: string; [key: string]: any }) => (
    <div className={cn("absolute flex items-center gap-2 animate-float", className)} {...props}>
        <CursorIcon className={cn("h-6 w-6 text-cyan-400", cursorClass)} />
        <div className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-full px-4 py-1.5 text-sm">
            {name}
        </div>
    </div>
);

const DevCollaboratorTag = ({ name, className, cursorClass, tagColorClass, ...props }: { name: string; className?: string; cursorClass?: string; tagColorClass?: string; [key: string]: any }) => (
    <div className={cn("absolute flex items-center gap-2 animate-float", className)} {...props}>
        <CursorIcon className={cn("h-6 w-6", cursorClass)} />
        <div className={cn("border rounded-full px-4 py-1.5 text-sm font-semibold", tagColorClass)}>
            {name}
        </div>
    </div>
);

const FeatureFlagIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M6 3V21M6 4H16L13 8L16 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export default function LandingPage() {
    const WorkflowStep = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
        <div className="flex flex-col items-center gap-3 z-10 bg-black px-2">
            <Icon className="h-6 w-6 text-neutral-600" />
            <span className="text-sm text-neutral-500">{label}</span>
        </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-black text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white text-black">
        <div className="container flex h-20 items-center justify-between mx-auto px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">HR Streamline AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-black text-white hover:bg-neutral-800">
              <Link href="/register">Try Now for Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center">
        
        {/* HERO SECTION */}
        <section className="container text-center py-20 sm:py-32 relative">
          {/* Floating tags */}
          <CollaboratorTag name="HR Admin" className="top-[calc(50%-12rem)] left-[10%] xl:left-[15%] hidden lg:flex" style={{ animationDelay: '400ms' }} />
          <CollaboratorTag name="Employee" className="top-[calc(50%-4rem)] right-[10%] xl:right-[15%] hidden lg:flex" cursorClass="!text-pink-400" style={{ animationDelay: '600ms' }} />

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
            Your HR workflow just got
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              1000x more collaborative
            </span>
          </h1>

          {/* Workflow diagram */}
          <div className="relative my-24 flex w-full max-w-4xl mx-auto items-center justify-between">
            <div className="absolute left-0 right-0 h-px bg-neutral-700 top-3 -z-10" />
            
            <WorkflowStep icon={FileText} label="Plan" />
            <WorkflowStep icon={Users} label="Recruit" />
            
            <div className="flex flex-col items-center gap-2 z-10 bg-black px-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="h-3 w-3 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-3 w-3 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm text-neutral-500 mt-1">Onboard</span>
              <div className="mt-2 bg-gradient-to-r from-blue-400/30 via-purple-500/30 to-pink-500/30 border border-purple-400/50 rounded-full px-4 py-1.5 text-sm text-purple-200">
                  HR Streamline AI
              </div>
            </div>
            
            <WorkflowStep icon={BarChart3} label="Report" />
          </div>

          {/* CTA Button */}
          <div className="flex justify-center gap-4">
              <Button size="lg" asChild className="bg-white text-black hover:bg-neutral-200 rounded-full px-8 py-3 h-auto">
                <Link href="/register">Try Now For Free</Link>
              </Button>
          </div>
        </section>

        {/* Precision Review Section */}
        <section className="container mx-auto py-20 sm:py-32">
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 md:p-16 text-center overflow-hidden">
            <div className="absolute top-8 left-8 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <Logo className="h-5 w-5 text-white/70" />
            </div>
            
            {/* Floating elements */}
            <CollaboratorTag name="Hiring Manager" className="top-1/4 left-8 hidden lg:flex" cursorClass="transform -rotate-12" />
            <CollaboratorTag name="Recruiter" className="bottom-1/4 right-8 hidden lg:flex" cursorClass="transform rotate-[120deg] !text-pink-400" />

            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-white">
              Review candidate profiles with precision
            </h2>
            <p className="text-lg text-blue-200 mb-16 max-w-2xl mx-auto">
              Collaborate directly on profiles and resumes for clearer feedback and faster decisions.
            </p>

            <div className="relative max-w-2xl mx-auto border-2 border-dashed border-blue-400/50 rounded-2xl p-8 min-h-[250px] flex items-center justify-center">
              <div className="relative animate-float" style={{ animationDelay: '0.2s' }}>
                <FileText className="h-24 w-24 text-pink-400/80" />
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 animate-float" style={{ animationDelay: '0.7s'}}>
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
        <section className="container mx-auto py-20 sm:py-32">
            <div className="relative rounded-2xl bg-gradient-to-br from-yellow-200 via-yellow-300 to-amber-300 p-8 md:p-16 text-center overflow-hidden">
                {/* Floating elements */}
                <div className="absolute top-8 left-8 w-10 h-10 bg-black/5 rounded-full flex items-center justify-center text-neutral-600">
                    <FeatureFlagIcon className="h-5 w-5" />
                </div>

                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/2 -translate-y-1/2 left-8 hidden lg:flex"
                    cursorClass="text-pink-500"
                    tagColorClass="bg-pink-500 text-white border-pink-500/50"
                />

                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/2 -translate-y-1/2 right-8 hidden lg:flex"
                    cursorClass="text-yellow-600"
                    tagColorClass="bg-yellow-500 text-black border-yellow-600/50"
                />

                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-black">
                    Manage, prioritize<br />& assign
                </h2>
                <p className="text-lg text-neutral-700 mb-16 max-w-2xl mx-auto">
                    Use our built-in task manager or integrate your own.
                </p>

                {/* Mock Task Card */}
                <div className="relative max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-4 text-left text-black animate-float" style={{ animationDuration: '8s' }}>
                    <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <div className="flex items-center gap-2">
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
                            src="https://placehold.co/40x40.png"
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
        <section className="container mx-auto py-20 sm:py-32">
            <div className="relative rounded-2xl bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-200 p-8 md:p-16 text-center overflow-hidden">
                {/* Top-left icon */}
                <div className="absolute top-8 left-8 w-10 h-10 bg-black/5 rounded-full flex items-center justify-center text-neutral-600">
                <Check className="h-5 w-5" />
                </div>

                {/* Floating Developer Tags */}
                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/4 left-12 hidden lg:flex"
                    cursorClass="text-lime-500"
                    tagColorClass="bg-lime-300 text-lime-900 font-bold border-lime-400"
                    style={{ animationDelay: '0.3s' }}
                />

                <DevCollaboratorTag
                    name="Developer"
                    className="bottom-1/4 right-12 hidden lg:flex"
                    cursorClass="text-pink-500"
                    tagColorClass="bg-pink-400 text-white font-bold border-pink-500"
                    style={{ animationDelay: '0.8s' }}
                />

                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-black">
                Get approvals<br />at hyper speed
                </h2>
                <p className="text-lg text-neutral-700 mb-16 max-w-2xl mx-auto">
                Built-in approvals for less back-and-forth-ing
                </p>

                {/* Mock Approval Card */}
                <div className="relative max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center text-black animate-float" style={{ animationDuration: '10s' }}>
                <div className="relative inline-block mb-4">
                    <Image
                    src="https://placehold.co/80x80.png"
                    alt="Mike Mulligan"
                    width={80}
                    height={80}
                    className="rounded-full"
                    data-ai-hint="man face"
                    />
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white">
                    <Check className="h-4 w-4 text-white" />
                    </div>
                </div>
                <p className="text-xl font-semibold">File was approved</p>
                <p className="text-xl font-semibold">by Mike Mulligan</p>
                <p className="text-sm text-neutral-500 mt-2">on 24th August 2023</p>
                <p className="font-serif italic text-2xl text-neutral-600 mt-6">
                    Mike Mulligan
                </p>
                </div>
            </div>
        </section>

        {/* Sync With Your Tools Section */}
        <section className="container mx-auto py-20 sm:py-32">
            <div className="relative rounded-2xl bg-gradient-to-br from-rose-100 via-pink-100 to-red-100 p-8 md:p-16 text-center overflow-hidden">
                <DevCollaboratorTag
                    name="Developer"
                    className="top-1/4 left-12 hidden lg:flex"
                    cursorClass="text-orange-500"
                    tagColorClass="bg-orange-300 text-orange-900 font-bold border-orange-400"
                    style={{ animationDelay: '0.2s' }}
                />
                <DevCollaboratorTag
                    name="Developer"
                    className="bottom-1/4 right-12 hidden lg:flex"
                    cursorClass="text-yellow-500"
                    tagColorClass="bg-yellow-300 text-yellow-900 font-bold border-yellow-400"
                    style={{ animationDelay: '0.7s' }}
                />

                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-black">
                    Sync with<br />your tools
                </h2>
                <p className="text-lg text-neutral-700 mb-12 max-w-2xl mx-auto">
                    Seamlessly integrate your Slack or favorite task manager
                </p>

                <div className="relative max-w-sm mx-auto bg-white rounded-full shadow-lg p-2 pr-4 text-left text-black animate-float flex items-center gap-3" style={{ animationDuration: '9s' }}>
                    <div className="bg-green-500 rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-sm text-neutral-700">
                        Let's change the color <span className="text-pink-500 font-semibold">@designer</span>
                    </p>
                    <Image
                        src="https://placehold.co/32x32.png"
                        alt="Designer Avatar"
                        width={28}
                        height={28}
                        className="rounded-full ml-auto"
                        data-ai-hint="woman face"
                    />
                </div>

                <div className="flex justify-center items-center gap-3 md:gap-4 mt-12 flex-wrap">
                    {[
                        { name: 'Monday.com', hint: 'monday com logo' },
                        { name: 'ClickUp', hint: 'clickup logo' },
                        { name: 'Slack', hint: 'slack logo' },
                        { name: 'Asana', hint: 'asana logo' },
                    ].map(tool => (
                        <div key={tool.name} className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2 shadow-md text-black">
                           {tool.name === 'Slack' ? (
                               <Slack className="h-5 w-5 md:h-6 md:w-6" />
                           ) : (
                                <Image src={`https://placehold.co/24x24.png`} width={24} height={24} alt={`${tool.name} logo`} data-ai-hint={tool.hint} />
                           )}
                           <span className="font-semibold text-sm md:text-base">{tool.name}</span>
                        </div>
                    ))}
                </div>
                
                <Link href="/integrations" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-black mt-16 group">
                    VIEW INTEGRATIONS
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </section>


        {/* Eliminate Redundant Tools Section */}
        <section className="bg-white text-black py-20 sm:py-32">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-neutral-800">
              Eliminate Redundant Tools.
            </h2>
            <p className="text-4xl md:text-5xl font-bold tracking-tight mb-16 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
              No more "busy" work
            </p>

            {/* Icons with connecting line */}
            <div className="relative flex justify-center items-center my-16">
              <div className="absolute w-10/12 sm:w-2/3 md:w-1/2 h-0.5 bg-rose-300"></div>
              <div className="relative flex justify-between items-center w-10/12 sm:w-2/3 md:w-1/2">
                {abstractIcons.map((Icon, index) => (
                  <div key={index} className="bg-white p-1 rounded-full">
                    <Icon />
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className="mt-28 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="flex items-center gap-4">
                <Image 
                  src="https://placehold.co/64x64.png" 
                  alt="Riley Hennigh" 
                  width={64} 
                  height={64} 
                  className="rounded-full" 
                  data-ai-hint="man face" 
                />
                <div>
                  <p className="font-semibold text-pink-500">Riley Hennigh</p>
                  <p className="text-sm text-neutral-500">Product Designer @Headway.io</p>
                </div>
              </div>
              <div className="max-w-md text-left">
                <p className="text-lg font-semibold text-neutral-800">
                  Everybody has loved how easy it is to get started
                </p>
                <p className="text-neutral-600 mt-1">
                  "HR Streamline has enabled fast feedback from stakeholders"
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Feature Marquee Section */}
        <div className="relative w-full overflow-hidden py-12">
            <div className="flex animate-marquee w-max">
            {[...features, ...features].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 bg-neutral-800/80 border border-neutral-700 rounded-full px-5 py-2 mx-3 text-sm text-neutral-300">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                {feature.name}
              </div>
            ))}
            </div>
        </div>

        {/* Consistent Collaboration Section */}
        <section className="bg-white text-black py-20 sm:py-32 overflow-hidden">
          <div className="container mx-auto text-center relative">
            {/* Floating Icons */}
            <div className="hidden lg:block absolute -top-8 left-[15%] animate-float">
              <AssetIcon
                icon={Play}
                className="border-cyan-500/20 bg-cyan-500/10"
                iconClassName="text-cyan-500"
              />
            </div>
            <div className="hidden lg:block absolute -bottom-8 left-[25%] animate-float" style={{ animationDelay: '1s' }}>
              <AssetIcon
                icon={FileJson}
                className="border-red-500/20 bg-red-500/10"
                iconClassName="text-red-500"
              />
            </div>
            <div className="hidden lg:block absolute -bottom-8 right-[25%] animate-float" style={{ animationDelay: '2s' }}>
              <AssetIcon
                icon={FileImage}
                className="border-purple-500/20 bg-purple-500/10"
                iconClassName="text-purple-500"
              />
            </div>
            <div className="hidden lg:block absolute top-1/2 right-[20%] -translate-y-1/2 animate-float" style={{ animationDelay: '1.5s' }}>
              <AssetIcon
                icon={FileSignatureIcon}
                className="border-green-500/20 bg-green-500/10"
                iconClassName="text-green-500"
              />
            </div>
            <div className="hidden lg:block absolute -top-8 right-[15%] animate-float" style={{ animationDelay: '0.5s' }}>
              <AssetIcon
                icon={Globe}
                className="border-indigo-500/20 bg-indigo-500/10"
                iconClassName="text-indigo-500"
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-neutral-800">
              Consistent collaboration
              <br />
              experience across <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">all assets in one place</span>
            </h2>
            <div className="flex justify-center my-10">
              <Button size="lg" asChild className="bg-black text-white hover:bg-neutral-800 rounded-full px-8 py-3 h-auto">
                <Link href="/register">Try Now For Free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="container py-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
        </div>
      </footer>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6">
          <Button size="icon" className="rounded-full h-14 w-14 bg-accent hover:bg-accent/90 shadow-lg">
            <MessageSquare className="h-7 w-7 text-accent-foreground" />
          </Button>
      </div>
    </div>
  );
}
