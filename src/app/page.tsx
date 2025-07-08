'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import { ArrowRight, Bot, Calendar, Mail, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-card p-6 rounded-lg shadow-lg transition-transform transform hover:-translate-y-2">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">HR Streamline AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container text-center py-20 sm:py-32">
          <div className="bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary inline-block mb-4">
            Powered by Generative AI
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
            Revolutionize Your HR Workflow
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            HR Streamline AI is an all-in-one intelligent assistant for HR operations, designed to automate tasks, enhance communication, and provide data-driven insights.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Start for Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="bg-secondary py-20 sm:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Features Built for Modern HR</h2>
              <p className="max-w-xl mx-auto mt-4 text-muted-foreground">
                From recruitment to daily management, our AI-powered tools have you covered.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Bot className="h-6 w-6" />}
                title="AI Recruitment"
                description="Generate job descriptions, analyze resumes for ATS scores, and conduct initial AI-powered interviews."
              />
              <FeatureCard
                icon={<Mail className="h-6 w-6" />}
                title="Email Assistance"
                description="Draft professional email responses for common HR inquiries and announcements in seconds."
              />
              <FeatureCard
                icon={<Calendar className="h-6 w-6" />}
                title="Attendance & Leave"
                description="Effortlessly track employee attendance, manage clock-ins/outs, and process leave requests."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Unified Hub"
                description="Integrate with tools like Gmail, Slack, and GitHub to manage all your communications in one place."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
