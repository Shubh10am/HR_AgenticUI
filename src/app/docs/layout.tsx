
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
    <div className="dark">
      <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4">
               <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground -ml-2">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
               <ThemeToggle />
              <Button variant="ghost" asChild className="text-foreground hover:bg-accent hover:text-accent-foreground hidden sm:flex">
                <Link href="/login">Log In</Link>
              </Button>
              <Button onClick={handleGuestLogin} disabled={isLoading || isGuestLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
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
    </div>
  );
}
