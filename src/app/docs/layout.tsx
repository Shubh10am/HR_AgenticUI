
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';

export default function DocsLayout({ children }: { children: ReactNode }) {
  const { loginAsGuest, isLoading } = useAuth();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    await loginAsGuest();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5" id="docs-logo-link">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/30">
                <Logo className="h-5 w-5" />
              </span>
              <span className="hidden font-display text-lg font-bold sm:inline">HR Streamline</span>
            </Link>
            <span className="h-5 w-px bg-border" />
            <Link href="/docs" className="text-sm font-semibold text-primary" id="docs-header-docs">Docs</Link>
            <Button asChild variant="ghost" size="sm" className="ml-2 hidden text-muted-foreground hover:text-foreground md:inline-flex" id="docs-back-home">
              <Link href="/"><ArrowLeft className="h-4 w-4" />Home</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
             <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:flex" id="docs-login">
              <Link href="/login">Log In</Link>
            </Button>
            <Button onClick={handleGuestLogin} disabled={isLoading || isGuestLoading} className="rounded-full" id="docs-try-now">
              {(isLoading || isGuestLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Try Now
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6">
          {children}
      </main>
    </div>
  );
}
