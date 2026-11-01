'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

/** Closing call to action shared by the blog index and posts. */
export default function BlogCta() {
  const { loginAsGuest, isLoading } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  const start = async () => {
    setIsStarting(true);
    await loginAsGuest();
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-accent px-6 py-12 text-center text-white shadow-2xl shadow-primary/30 sm:px-12">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-25" />
      <div className="relative">
        <h2 className="mx-auto max-w-2xl font-display text-2xl font-bold tracking-tight sm:text-4xl">Put these ideas to work</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">Try HR Streamline AI free as a guest, or read how each module works in the docs.</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button id="blog-cta-try" onClick={start} disabled={isLoading || isStarting} className="h-11 rounded-full bg-white px-6 text-primary hover:bg-white/90">
            {(isLoading || isStarting) && <Loader2 className="animate-spin" />} Try it free <ArrowRight />
          </Button>
          <Button id="blog-cta-docs" asChild variant="outline" className="h-11 rounded-full border-white/30 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white">
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
