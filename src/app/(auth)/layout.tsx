import type { ReactNode } from 'react';
import Link from 'next/link';
import AuthShowcase from '@/components/auth/auth-showcase';
import ParticleField from '@/components/landing/particle-field';

/** Sign-in, sign-up and password pages, in the home page's dark theme: the showcase beside the form. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[#08090e] text-white lg:grid-cols-[1.05fr_1fr]">
      <div className="lg:sticky lg:top-0 lg:h-screen">
        <AuthShowcase />
      </div>
      <div className="relative isolate flex flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        <ParticleField />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-10 -z-10 h-[380px] w-[420px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-0 -z-10 h-[320px] w-[380px] rounded-full bg-violet-600/10 blur-[120px]" />
        {/* The app's dark tokens, scoped to the form, so every input and button matches the page. */}
        <div className="auth-form dark relative z-10 w-full max-w-md">{children}</div>
        <p className="relative z-10 mt-8 text-center text-[11px] text-slate-500">
          <Link href="/legal/privacy" className="hover:text-slate-300">Privacy</Link> · <Link href="/legal/terms" className="hover:text-slate-300">Terms</Link>
        </p>
      </div>
    </div>
  );
}
