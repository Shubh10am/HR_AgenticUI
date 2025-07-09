import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Hash, Linkedin, X, Instagram, Youtube, ArrowLeft } from 'lucide-react';

export default function LegalLayout({ children }: { children: ReactNode }) {
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

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="ghost" className="text-neutral-400 hover:text-white hover:bg-transparent px-0 mb-8">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Logo className="h-8 w-8 text-primary" />
                <span className="font-bold text-lg text-white">HR Streamline AI</span>
              </Link>
              <ul className="space-y-2">
                <li><Link href="/recruitment" className="text-neutral-400 hover:text-white">For Recruitment</Link></li>
                <li><Link href="/tasks" className="text-neutral-400 hover:text-white">For Onboarding</Link></li>
                <li><Link href="/attendance-reporting" className="text-neutral-400 hover:text-white">For Reporting</Link></li>
                <li><Link href="/unified-communications" className="text-neutral-400 hover:text-white">For Communication</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Integrations</h3>
              <ul className="space-y-2">
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">Slack</Link></li>
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">Gmail</Link></li>
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">Google Calendar</Link></li>
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">GitHub</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-neutral-400 hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="text-neutral-400 hover:text-white">Blog</Link></li>
                <li><Link href="#" className="text-neutral-400 hover:text-white">Docs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/legal/security" className="text-neutral-400 hover:text-white">Security</Link></li>
                <li><Link href="/legal/privacy" className="text-neutral-400 hover:text-white">Privacy</Link></li>
                <li><Link href="/legal/terms" className="text-neutral-400 hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-800">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between py-6 text-sm text-neutral-500 px-4 sm:px-6 sm:pr-20">
            <div className="flex items-center gap-6 order-2 sm:order-1 mt-4 sm:mt-0">
                <Link href="#" className="hover:text-white transition-colors"><Hash className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><X className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Youtube className="h-5 w-5" /></Link>
            </div>
            <div className="order-1 sm:order-2">
              © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
