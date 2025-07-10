
import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Hash, Linkedin, X, Instagram, Youtube } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="container flex h-20 items-center justify-between mx-auto px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg text-foreground">HR Streamline AI</span>
            </Link>
            <div className="flex items-center gap-2">
               <ThemeToggle />
              <Button variant="ghost" asChild className="text-foreground hover:bg-accent hover:text-accent-foreground hidden sm:flex">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                <Link href="/register">Try Now</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-background text-foreground">
          <div className="container mx-auto px-4 sm:px-6 py-16">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              <div className="col-span-2 lg:col-span-2">
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <Logo className="h-8 w-8 text-primary" />
                  <span className="font-bold text-lg text-foreground">HR Streamline AI</span>
                </Link>
                <ul className="space-y-2">
                  <li><Link href="/recruitment" className="text-muted-foreground hover:text-foreground">For Recruitment</Link></li>
                  <li><Link href="/tasks" className="text-muted-foreground hover:text-foreground">For Onboarding</Link></li>
                  <li><Link href="/attendance-reporting" className="text-muted-foreground hover:text-foreground">For Reporting</Link></li>
                  <li><Link href="/unified-communications" className="text-muted-foreground hover:text-foreground">For Communication</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Integrations</h3>
                <ul className="space-y-2">
                  <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground">Slack</Link></li>
                  <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground">Gmail</Link></li>
                  <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground">Google Calendar</Link></li>
                  <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground">GitHub</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
                  <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-foreground">Docs</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><Link href="/legal/security" className="text-muted-foreground hover:text-foreground">Security</Link></li>
                  <li><Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                  <li><Link href="/legal/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-border">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between py-6 text-sm text-muted-foreground px-4 sm:px-6 sm:pr-20">
              <div className="flex items-center gap-6 order-2 sm:order-1 mt-4 sm:mt-0">
                  <Link href="#" className="hover:text-foreground transition-colors"><Hash className="h-5 w-5" /></Link>
                  <Link href="#" className="hover:text-foreground transition-colors"><Linkedin className="h-5 w-5" /></Link>
                  <Link href="#" className="hover:text-foreground transition-colors"><X className="h-5 w-5" /></Link>
                  <Link href="#" className="hover:text-foreground transition-colors"><Instagram className="h-5 w-5" /></Link>
                  <Link href="#" className="hover:text-foreground transition-colors"><Youtube className="h-5 w-5" /></Link>
              </div>
              <div className="order-1 sm:order-2">
                © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
