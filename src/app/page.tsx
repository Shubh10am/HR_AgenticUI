'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import type { SVGProps } from 'react';
import { FileText, Briefcase, Users, BarChart3, PlayCircle, Mail, MessageSquare } from 'lucide-react';
import Image from 'next/image';


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

const dockIcons = [
    { name: 'Gmail', src: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', dataAiHint: 'gmail logo' },
    { name: 'Slack', src: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png', dataAiHint: 'slack logo' },
    { name: 'Sheets', src: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg', dataAiHint: 'google sheets logo' },
    { name: 'Zoom', src: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Zoom_icon.svg', dataAiHint: 'zoom logo' },
    { name: 'Teams', src: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg', dataAiHint: 'microsoft teams logo' },
    { name: 'Meet', src: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg', dataAiHint: 'google meet logo' }
];


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full">
        <div className="container flex h-20 items-center justify-between mx-auto px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-white" />
            <span className="font-bold text-lg">HR Streamline AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hover:bg-neutral-800 hover:text-white">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-white text-black hover:bg-neutral-200">
              <Link href="/register">Try Now for Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="container text-center py-20 sm:py-32 relative">
          
          {/* Floating decorative tags */}
          <div className="absolute top-[calc(50%-10rem)] left-[15%] hidden lg:block animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CursorIcon className="h-6 w-6 text-cyan-400 transform -rotate-12 translate-x-16 -translate-y-2" />
            <div className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-full px-4 py-1.5 text-sm">
              HR Admin
            </div>
          </div>
          
          <div className="absolute top-[calc(50%)] right-[15%] hidden lg:block animate-fade-in" style={{ animationDelay: '600ms' }}>
             <div className="bg-pink-400/20 text-pink-300 border border-pink-400/30 rounded-full px-4 py-1.5 text-sm">
              Employee
            </div>
            <CursorIcon className="h-6 w-6 text-pink-400 transform rotate-[135deg] -translate-x-16 translate-y-2" />
          </div>


          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
            Revolutionize Your HR,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              Impossibly Fast
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-neutral-400 mb-10">
            Get your team aligned with fewer meetings. Get back to focusing on people.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild className="bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700">
              <Link href="/login">Log In</Link>
            </Button>
            <Button size="lg" asChild className="bg-white text-black hover:bg-neutral-200">
              <Link href="/register">Try Now For Free</Link>
            </Button>
          </div>
        </section>

        {/* Scattered Tools Section */}
        <section className="container mx-auto py-20 sm:py-32">
          <div className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-3xl p-8 md:p-16 relative overflow-hidden text-center">
            <CursorIcon className="h-10 w-10 text-white absolute top-16 left-1/2 transform -translate-x-12 animate-pulse" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-neutral-800">
              Scattered tools put HR in slow motion.
            </h2>
            <p className="max-w-xl mx-auto text-lg text-neutral-700 mb-12">
              Switching between email, Slack, and spreadsheets isn't just inefficient. It's a bottleneck.
            </p>
            
            <div className="relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
                    <p>You are using <strong className="font-bold">more than 6 tools</strong> to manage people.</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-neutral-800"></div>
                </div>
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 inline-flex gap-4 border border-white/10 shadow-xl">
                    {dockIcons.map(icon => (
                        <div key={icon.name} className="bg-white/10 p-2 rounded-lg">
                            <Image 
                                src={icon.src} 
                                alt={`${icon.name} logo`} 
                                width={40} 
                                height={40} 
                                className="object-contain"
                                data-ai-hint={icon.dataAiHint}
                            />
                        </div>
                    ))}
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
      </main>

      <footer className="border-t border-neutral-800">
        <div className="container py-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
        </div>
      </footer>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6">
          <Button size="icon" className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-500 shadow-lg">
            <MessageSquare className="h-7 w-7 text-white" />
          </Button>
      </div>
    </div>
  );
}
