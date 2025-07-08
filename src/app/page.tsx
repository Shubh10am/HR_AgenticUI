'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import type { SVGProps } from 'react';

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
      <main className="flex-1 flex items-center">
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
      </main>

      <footer className="border-t border-neutral-800">
        <div className="container py-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
