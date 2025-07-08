
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

// Abstract icons for the "Eliminate Redundant Tools" section
const Icon1 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#FCA5A5"/><circle cx="20" cy="20" r="6" fill="#DC2626"/></svg>;
const Icon2 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="10" fill="#818CF8"/><path d="M13 20H27" stroke="white" strokeWidth="3" strokeLinecap="round"/><path d="M20 13L20 27" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>;
const Icon3 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="20" height="20" rx="10" fill="#60A5FA"/><path d="M16 20L20 24L25 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Icon4 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L27.5 12.5L20 25L12.5 12.5L20 0Z" fill="#FCD34D"/><path d="M20 15L27.5 27.5L20 40L12.5 27.5L20 15Z" fill="#FBBF24"/></svg>;
const Icon5 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5L35 20L20 35L5 20L20 5Z" fill="#A78BFA"/><path d="M20 12L28 20L20 28L12 20L20 12Z" fill="white"/></svg>;
const Icon6 = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#4ADE80"/><circle cx="15" cy="15" r="4" fill="white"/><circle cx="25" cy="25" r="4" fill="white"/></svg>;

const abstractIcons = [Icon1, Icon2, Icon3, Icon4, Icon5, Icon6];

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
