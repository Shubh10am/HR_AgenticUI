'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, BriefcaseBusiness, CalendarDays, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Logo from '@/components/icons/logo';
import ParticleField, { type ParticleShape } from '@/components/landing/particle-field';
import { cn } from '@/lib/utils';

/** The workflow steps the dots act out, with the particle field's shape for each. */
const STEPS = [
  { label: 'Recruit', icon: Users, shape: 3 },
  { label: 'Onboard', icon: BadgeCheck, shape: 4 },
  { label: 'Attendance', icon: CalendarDays, shape: 5 },
  { label: 'Payroll', icon: BriefcaseBusiness, shape: 6 },
];
const STEP_MS = 3400;

const POINTS = [
  'Recruiting, onboarding, attendance and payroll in one workspace',
  'A Copilot that answers from your own policies, with sources',
  'Your team reviews every important decision before it goes out',
];

/** The dark, landing-style panel beside the sign-in and sign-up forms. */
export default function AuthShowcase() {
  const [step, setStep] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<ParticleShape>({ index: STEPS[0].shape, x: 0.5, y: 0.55, size: 0.3 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setStep((current) => (current + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  // Form the shape in the open space between the headline and the step strip.
  useEffect(() => {
    const place = () => {
      const box = panel.current?.getBoundingClientRect();
      const area = stage.current?.getBoundingClientRect();
      if (!box || !area) return;
      const side = Math.min(area.height * 0.9, area.width * 0.6, 260);
      setShape({
        index: side >= 90 ? STEPS[step].shape : null,
        x: (area.left + area.width / 2 - box.left) / box.width,
        y: (area.top + area.height / 2 - box.top) / box.height,
        size: side / Math.min(box.width, box.height * 1.6),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [step]);

  return (
    <div ref={panel} id="auth-showcase" className="relative isolate hidden h-full flex-col overflow-hidden bg-[#08090e] p-10 text-white lg:flex xl:p-14">
      <ParticleField shape={shape} />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-10 -z-10 h-[420px] w-[520px] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 right-0 -z-10 h-[360px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      <Link href="/" className="relative z-10 flex w-fit items-center gap-2.5" id="auth-showcase-home">
        <Logo className="h-9 w-9" />
        <span className="text-lg font-bold tracking-tight">
          HR Streamline <span className="text-indigo-300">AI</span>
        </span>
      </Link>

      <div className="relative z-10 mt-14 max-w-[520px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/[0.06] px-3.5 py-1.5 text-xs font-medium text-violet-200">
          <Sparkles size={13} /> The agentic HR platform
        </span>
        <h2 className="mt-6 text-[clamp(2.2rem,3.6vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.05em]">
          Your HR workflows,
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">connected by AI.</span>
        </h2>
      </div>

      {/* Open space the dots draw the current step's shape in. */}
      <div ref={stage} aria-hidden className="relative z-10 min-h-[140px] flex-1" />

      <div className="relative z-10">
        <div className="flex flex-wrap gap-2">
          {STEPS.map(({ label, icon: Icon }, index) => (
            <span
              key={label}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition duration-500',
                index === step ? 'border-violet-300/50 bg-violet-500/15 text-violet-100 shadow-[0_0_24px_#8b5cf633]' : 'border-white/10 text-slate-400'
              )}
            >
              <Icon size={13} /> {label}
            </span>
          ))}
        </div>
        <ul className="mt-7 space-y-3 text-sm text-slate-300">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" /> {point}
            </li>
          ))}
        </ul>
        <p className="mt-8 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck size={13} /> Workspace data stays in your organization&apos;s account.
        </p>
      </div>
    </div>
  );
}
