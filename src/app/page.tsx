'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BadgeCheck, BookOpenText, BriefcaseBusiness, CalendarDays, Check, Clock3, FileText, Inbox, Layers3, Menu, MessageSquareText, MousePointer2, ShieldCheck, Sparkles, Users, Workflow, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import CopilotSidebar from '@/components/chat-widget';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Logo from '@/components/icons/logo';
import ParticleField, { type ParticleShape } from '@/components/landing/particle-field';
import { useHeroWorkflowShapes } from '@/components/landing/hero-workflow-shapes';
import AgentJourney from '@/components/landing/agent-journey';
import AgentProcess from '@/components/landing/agent-process';
import ConnectedIntelligence from '@/components/landing/connected-intelligence';

type PreviewKey = 'overview' | 'hiring' | 'inbox' | 'copilot';
/** Dot shapes for the tour steps, in order: layers, people, envelope, chat bubble. */
const TOUR_SHAPES = [9, 3, 7, 8];
const tabs: { id: PreviewKey; label: string }[] = [
  { id: 'overview', label: 'People overview' },
  { id: 'hiring', label: 'Recruitment' },
  { id: 'inbox', label: 'Gmail inbox' },
  { id: 'copilot', label: 'HR Copilot' },
];
const navItems = [
  { label: 'Overview', icon: Layers3 },
  { label: 'People', icon: Users },
  { label: 'Recruitment', icon: BriefcaseBusiness },
  { label: 'Attendance', icon: Clock3 },
  { label: 'Gmail inbox', icon: Inbox },
];
const tourSteps: { id: PreviewKey; title: string; description: string; note: string }[] = [
  { id: 'overview', title: 'Start with the whole team in view.', description: 'See people activity, open roles, and requests that need attention from one workspace overview.', note: 'A live view across people operations' },
  { id: 'hiring', title: 'Screen candidates with AI precision.', description: 'Compare resumes with the role, review the reasons behind each match, and build a shortlist your hiring team can discuss.', note: 'AI-assisted candidate review' },
  { id: 'inbox', title: 'Turn HR email into the next step.', description: 'Keep Gmail conversations organized and prepare clear replies that a person can review before sending.', note: 'Gmail inbox and reply drafts' },
  { id: 'copilot', title: 'Get answers grounded in your policies.', description: 'Ask the HR Copilot a question and follow its answer back to the source material in your knowledge base.', note: 'Answers with source references' },
];

function trackPointer(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch') return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--pointer-x', ((event.clientX - bounds.left) / bounds.width) * 100 + '%');
  event.currentTarget.style.setProperty('--pointer-y', ((event.clientY - bounds.top) / bounds.height) * 100 + '%');
  event.currentTarget.classList.add('pointer-active');
}

function clearPointer(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.classList.remove('pointer-active');
}

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return <div className="mb-4 flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-600">{eyebrow}</p><h3 className="mt-1 truncate text-base font-bold tracking-tight sm:text-xl">{title}</h3><p className="mt-1 hidden text-[11px] text-slate-500 sm:block">{sub}</p></div><span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-medium text-slate-600">This week⌄</span></div>;
}

function Overview() {
  const stats = [
    { label: 'Team members', value: '128', note: '+6 this month', icon: Users, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Open positions', value: '08', note: '3 new applicants', icon: BriefcaseBusiness, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Pending requests', value: '05', note: 'Needs a review', icon: CalendarDays, tone: 'bg-amber-50 text-amber-600' },
  ];
  return <><Heading eyebrow="Monday, October 26" title="Good morning, Sarah" sub="Here’s a quick look at what’s happening across your team." /><div className="grid grid-cols-3 gap-2 sm:gap-3">{stats.map(({ label, value, note, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3.5"><div className={'mb-2 hidden h-7 w-7 items-center justify-center rounded-lg sm:flex ' + tone}><Icon size={14} /></div><p className="text-[9px] leading-tight text-slate-500 sm:text-[10px]">{label}</p><div className="mt-1 flex flex-wrap items-baseline gap-x-2"><strong className="text-lg font-bold sm:text-2xl">{value}</strong><span className="hidden text-[9px] text-emerald-600 sm:inline">{note}</span></div></div>)}</div><div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-[1.15fr_0.85fr]"><div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4"><div className="flex items-center justify-between"><strong className="text-[11px] sm:text-xs">Team activity</strong><span className="text-[9px] text-slate-400">Last 7 days</span></div><div className="mt-4 flex h-[82px] items-end justify-between gap-1.5 sm:h-[112px] sm:gap-2">{[42, 64, 50, 78, 57, 88, 68].map((height, i) => <div key={i} className="flex h-full flex-1 items-end rounded-t-md bg-indigo-50"><div className={'w-full rounded-t-md ' + (i === 5 ? 'bg-indigo-600' : 'bg-indigo-300')} style={{ height: height + '%' }} /></div>)}</div><div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div><div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4"><strong className="text-[11px] sm:text-xs">Needs your attention</strong><div className="mt-3 space-y-2.5">{[['Leave requests', '2 to review', 'bg-amber-100 text-amber-700'], ['Candidate shortlist', '3 new profiles', 'bg-violet-100 text-violet-700'], ['Team updates', '1 announcement', 'bg-sky-100 text-sky-700']].map(([name, info, tone]) => <div key={name} className="flex items-center gap-2"><span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ' + tone}><ArrowUpRight size={13} /></span><div className="min-w-0"><p className="truncate text-[9px] font-semibold sm:text-[10px]">{name}</p><p className="text-[8px] text-slate-500 sm:text-[9px]">{info}</p></div><ArrowRight className="ml-auto text-slate-300" size={12} /></div>)}</div></div></div></>;
}

function Hiring() {
  const rows = [['Ava Chen', 'Frontend Engineer', '92%', 'bg-emerald-100 text-emerald-700'], ['Noah Williams', 'Product Designer', '87%', 'bg-indigo-100 text-indigo-700'], ['Mia Patel', 'People Operations', '81%', 'bg-amber-100 text-amber-700']];
  return <><Heading eyebrow="Recruitment · Frontend Engineer" title="Candidate shortlist" sub="AI-assisted screening with clear reasons behind every match." /><div className="mb-3 flex items-center justify-between rounded-xl bg-indigo-600 p-3 text-white sm:p-4"><div><p className="text-[9px] text-indigo-100">Role match overview</p><p className="mt-1 text-sm font-bold sm:text-base">12 candidates reviewed</p></div><div className="text-right"><p className="text-lg font-bold sm:text-2xl">4.8<span className="text-xs font-medium text-indigo-100"> / 5</span></p><p className="text-[8px] text-indigo-100">Average match</p></div></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="hidden grid-cols-[1.2fr_1fr_0.55fr] border-b border-slate-100 px-3 py-2 text-[8px] font-semibold uppercase tracking-wider text-slate-400 sm:grid"><span>Candidate</span><span>Skills & role</span><span>Score</span></div>{rows.map(([name, role, score, tone]) => <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-slate-100 px-3 py-2.5 last:border-0 sm:grid-cols-[1.2fr_1fr_0.55fr]"><div className="flex min-w-0 items-center gap-2"><span className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ' + tone}>{name.split(' ').map((part) => part[0]).join('')}</span><div className="min-w-0"><p className="truncate text-[10px] font-semibold">{name}</p><p className="truncate text-[8px] text-slate-500">{role}</p></div></div><p className="hidden truncate text-[9px] text-slate-500 sm:block">Relevant experience and skills</p><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">{score} match</span></div>)}</div><div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 p-2.5 text-[9px] text-indigo-800"><Sparkles size={13} className="shrink-0" /><span>Review the evidence and make the final call. AI suggestions support your hiring team.</span></div></>;
}

function InboxView() {
  const messages = [['EL', 'Elena Lopez', 'Leave request for Friday', '9:42 AM'], ['JR', 'James Rivera', 'Re: Interview schedule', '9:18 AM'], ['MT', 'Maya Thompson', 'Updated onboarding plan', 'Yesterday']];
  return <><Heading eyebrow="Gmail · connected inbox" title="Good morning, Sarah" sub="Triage messages and prepare thoughtful replies in one place." /><div className="grid min-h-[245px] overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-[0.8fr_1.2fr]"><div className="border-b border-slate-100 sm:border-b-0 sm:border-r">{messages.map(([initials, name, subject, time], i) => <div key={name} className={'border-b border-slate-100 p-2.5 last:border-0 ' + (i === 0 ? 'bg-indigo-50/80' : '')}><div className="flex items-center justify-between gap-1"><span className="truncate text-[9px] font-semibold">{name}</span><span className="shrink-0 text-[8px] text-slate-400">{time}</span></div><div className="mt-1 flex items-center gap-1.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[7px] font-bold text-slate-600">{initials}</span><span className="truncate text-[8px] text-slate-600">{subject}</span></div></div>)}</div><div className="p-3 sm:p-4"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-[8px] font-bold text-rose-700">EL</span><div><p className="text-[9px] font-semibold">Elena Lopez</p><p className="text-[8px] text-slate-400">To: Sarah · 9:42 AM</p></div></div><h4 className="mt-3 text-[10px] font-bold">Leave request for Friday</h4><p className="mt-2 text-[9px] leading-relaxed text-slate-500">Hi Sarah, could I take this Friday off? I have submitted the request in the portal. Thanks!</p><div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-2.5"><div className="flex items-center gap-1.5 text-[8px] font-semibold text-indigo-700"><Sparkles size={11} /> Suggested reply</div><p className="mt-1.5 text-[8px] leading-relaxed text-slate-600">Hi Elena, thanks for letting me know. I’ll review your request and get back to you shortly.</p><div className="mt-2 flex items-center justify-between"><span className="text-[7px] text-slate-400">Review before sending</span><span className="rounded-md bg-indigo-600 px-2 py-1 text-[8px] font-semibold text-white">Use draft</span></div></div></div></div></>;
}

function Copilot() {
  return <><Heading eyebrow="Company knowledge" title="Ask HR Copilot" sub="Get clear answers grounded in your organization’s own resources." /><div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4"><p className="text-[9px] font-medium text-slate-400">YOU ASKED</p><p className="mt-1.5 text-xs font-semibold sm:text-sm">How much notice do I need to give for annual leave?</p><div className="my-3 h-px bg-slate-100" /><div className="flex gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white"><Sparkles size={14} /></span><div><p className="text-[9px] font-semibold text-indigo-700">HR Copilot</p><p className="mt-1 text-[9px] leading-relaxed text-slate-600 sm:text-[10px]">Please submit annual leave requests at least <strong>two weeks in advance</strong>. Your manager will review the request based on team coverage and available balance.</p><div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5"><div className="flex items-center gap-1.5 text-[8px] font-semibold text-slate-600"><FileText size={11} /> Source used</div><p className="mt-1 text-[8px] text-slate-500">Employee Handbook · Time Off · Section 3.2</p></div></div></div><div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[9px] text-slate-400"><span className="flex-1">Ask about a policy or process…</span><span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white"><ArrowRight size={12} /></span></div></div><p className="mt-2 text-center text-[8px] text-slate-400">Answers link back to your source material for easy verification.</p></>;
}

function Preview({ active }: { active: PreviewKey }) {
  const label = tabs.find((tab) => tab.id === active)?.label ?? 'People overview';
  return <div className="overflow-hidden rounded-[22px] border border-white/15 bg-[#f7f8fc] text-slate-800 shadow-[0_32px_100px_rgba(0,0,0,0.46)] ring-1 ring-black/10"><div className="flex h-11 items-center justify-between border-b border-slate-200 bg-white px-4"><div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff6b67]" /><span className="h-2.5 w-2.5 rounded-full bg-[#ffc34d]" /><span className="h-2.5 w-2.5 rounded-full bg-[#47c978]" /></div><span className="hidden text-[11px] font-medium text-slate-400 sm:block">app.hrstreamline.ai / {label.toLowerCase().replaceAll(' ', '-')}</span><div className="flex items-center gap-2"><span className="text-[10px] font-medium text-slate-500">Sample workspace</span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700">SJ</span></div></div><div className="grid min-h-[360px] grid-cols-[56px_1fr] sm:min-h-[430px] sm:grid-cols-[142px_1fr]"><aside className="border-r border-slate-200 bg-white px-2 py-4 sm:px-3"><div className="mb-5 hidden items-center gap-2 px-2 sm:flex"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white"><Layers3 size={15} /></span><span className="text-[11px] font-bold">Streamline</span></div><div className="space-y-1">{navItems.map(({ label: navLabel, icon: Icon }, index) => { const selected = (active === 'overview' && index === 0) || (active === 'hiring' && index === 2) || (active === 'inbox' && index === 4) || (active === 'copilot' && index === 0); return <div key={navLabel} className={'flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-[10px] sm:justify-start ' + (selected ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-500')}><Icon size={14} /><span className="hidden sm:block">{navLabel}</span></div>; })}</div><div className="mt-6 hidden border-t border-slate-100 pt-4 sm:block"><p className="px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p><div className="mt-2 flex items-center gap-2 px-2 text-[10px] text-slate-500"><BookOpenText size={13} /> Knowledge base</div><div className="mt-3 flex items-center gap-2 px-2 text-[10px] text-slate-500"><Workflow size={13} /> Tasks & workflows</div></div></aside><main key={active} className="preview-screen-enter min-w-0 p-3 sm:p-5">{active === 'overview' && <Overview />}{active === 'hiring' && <Hiring />}{active === 'inbox' && <InboxView />}{active === 'copilot' && <Copilot />}</main></div></div>;
}

function ProductTour({ active, onChange }: { active: PreviewKey; onChange: (preview: PreviewKey) => void }) {
  const track = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = track.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      const distance = element.offsetHeight - window.innerHeight;
      if (bounds.top > 80 || bounds.bottom < window.innerHeight) return;
      const progress = Math.max(0, Math.min(0.999, -bounds.top / distance));
      onChange(tourSteps[Math.min(3, Math.floor(progress * 4))].id);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    update();
    return () => { window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); cancelAnimationFrame(frame); };
  }, [onChange]);
  const index = tourSteps.findIndex((step) => step.id === active);
  const step = tourSteps[index];

  // The dots gather into this step's shape in the open space under the copy.
  const stage = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<ParticleShape>({ index: null, x: 0, y: 0, size: 0 });
  useEffect(() => {
    const place = () => {
      const box = stage.current?.getBoundingClientRect();
      const text = copy.current?.getBoundingClientRect();
      if (!box || !text) return;
      // The space between the copy and the bottom of the preview, clear of the step indicators.
      const indicators = copy.current?.parentElement?.nextElementSibling?.getBoundingClientRect().top;
      const floor = (indicators ?? box.bottom) - 14;
      const room = floor - text.bottom - 18;
      const side = Math.min(text.width * 0.55, room * 0.9, 210);
      // Only beside the preview on wide screens, and only when it fits under the copy.
      if (window.innerWidth < 1024 || side < 64) return setShape((current) => ({ ...current, index: null }));
      setShape({
        index: TOUR_SHAPES[index],
        x: (text.left + side / 2 + 8 - box.left) / box.width,
        y: ((text.bottom + floor) / 2 - box.top) / box.height,
        size: side / Math.min(box.width, box.height * 1.6),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [index]);

  const selectStep = (id: PreviewKey) => {
    const element = track.current;
    if (!element) return;
    const next = tourSteps.findIndex((item) => item.id === id);
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top + (element.offsetHeight - window.innerHeight) * ((next + 0.1) / 4), behavior: 'smooth' });
  };
  return <section ref={track} id="product-tour" className="product-tour-track dark-dot-surface relative bg-[#090a10] text-white" onPointerMove={trackPointer} onPointerLeave={clearPointer}>
    <div ref={stage} className="product-tour-stage"><ParticleField shape={shape} />
      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 sm:px-8">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Explore the workspace</span>
          <span className="text-xs tabular-nums text-slate-400">0{index + 1} / 04</span>
        </div>
        <div className="grid items-center gap-7 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          {/* Top-aligned on wide screens so the space below the copy is free for the dot shape. */}
          <div ref={copy} key={active} className="tour-copy-enter lg:self-start lg:pt-8">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-indigo-300">{tabs[index].label}</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">{step.title}</h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">{step.description}</p>
            <span className="mt-6 hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 sm:inline-flex"><Sparkles size={13} />{step.note}</span>
          </div>
          <div className="min-w-0"><Preview active={active} /></div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">{tabs.map((tab, i) => <button key={tab.id} onClick={() => selectStep(tab.id)} aria-current={active === tab.id ? 'step' : undefined} aria-label={tab.label} className={'h-1.5 rounded-full transition-all duration-500 ' + (active === tab.id ? 'w-12 bg-white' : 'w-6 bg-white/20 hover:bg-white/50')} />)}</div>
          <span className="text-[10px] text-slate-500">Scroll to explore ↓</span>
        </div>
      </div>
    </div>
  </section>;
}

function HiringCard() {
  return <div className="space-y-2.5"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold">Frontend Engineer</span><span className="rounded-full bg-violet-50 px-2 py-1 text-[8px] text-violet-700">12 applicants</span></div>{[['Ava Chen', 'React · TypeScript', '92%'], ['Noah Williams', 'UI systems · 6 yrs', '87%']].map(([name, skills, score]) => <div key={name} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white p-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[8px] font-bold text-indigo-700">{name.split(' ').map((x) => x[0]).join('')}</span><div className="min-w-0 flex-1"><p className="text-[9px] font-semibold">{name}</p><p className="text-[8px] text-slate-400">{skills}</p></div><span className="text-[9px] font-bold text-emerald-600">{score}</span></div>)}</div>;
}
function PeopleCard() {
  const rows = [['AL', 'Ava Lee', 'Checked in · 9:02 AM', 'bg-emerald-100 text-emerald-700'], ['NK', 'Noah Kim', 'Working remotely', 'bg-sky-100 text-sky-700'], ['MS', 'Mia Singh', 'Leave · Approved', 'bg-amber-100 text-amber-700']];
  return <div className="rounded-xl border border-slate-100 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5"><span className="text-[9px] font-semibold">Today · Attendance</span><CalendarDays size={13} className="text-slate-400" /></div>{rows.map(([initials, name, status, tone]) => <div key={name} className="flex items-center gap-2.5 border-b border-slate-50 px-3 py-2 last:border-0"><span className={'flex h-6 w-6 items-center justify-center rounded-full text-[7px] font-bold ' + tone}>{initials}</span><div className="flex-1"><p className="text-[8px] font-semibold">{name}</p><p className="text-[7px] text-slate-400">{status}</p></div><Check size={12} className="text-emerald-500" /></div>)}</div>;
}
function EmailCard() {
  return <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-[8px] font-bold text-rose-700">EL</span><div><p className="text-[9px] font-semibold">Elena Lopez</p><p className="text-[8px] text-slate-400">Leave request for Friday</p></div></div><div className="mt-3 rounded-lg bg-indigo-50 p-2.5"><p className="flex items-center gap-1 text-[8px] font-semibold text-indigo-700"><Sparkles size={10} /> Suggested reply</p><p className="mt-1.5 text-[8px] leading-relaxed text-slate-600">Thanks for submitting your request. I’ll review it and follow up shortly.</p></div><p className="mt-2 text-right text-[7px] text-slate-400">Review before sending</p></div>;
}
function KnowledgeCard() {
  return <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white"><Sparkles size={13} /></span><div><p className="text-[8px] font-semibold text-indigo-700">HR Copilot</p><p className="mt-1 text-[9px] leading-relaxed text-slate-600">Annual leave requests should be submitted at least two weeks in advance.</p></div></div><div className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-[7px] text-slate-500"><FileText size={10} /> Employee Handbook · Time Off</div></div>;
}
function TasksCard() {
  const columns: [string, string[]][] = [['To do', ['Review new candidates', 'Update onboarding']], ['In progress', ['Prepare offer letter']], ['Done', ['Publish job post']]];
  return <div className="grid grid-cols-3 gap-1.5">{columns.map(([title, cards]) => <div key={title} className="rounded-lg bg-slate-100 p-1.5"><p className="mb-1.5 text-[7px] font-semibold text-slate-500">{title}</p>{cards.map((card) => <div key={card} className="mb-1 rounded-md border border-slate-100 bg-white p-1.5 text-[7px] leading-tight text-slate-600">{card}</div>)}</div>)}</div>;
}
function EmployeeCard() {
  return <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex items-center justify-between"><span className="text-[9px] font-semibold">People directory</span><span className="text-[7px] text-slate-400">128 teammates</span></div><div className="mt-3 space-y-2">{[['SC', 'Sarah Chen', 'People · Admin', 'bg-indigo-100 text-indigo-700'], ['AL', 'Ava Lee', 'Engineering · Lead', 'bg-emerald-100 text-emerald-700'], ['NK', 'Noah Kim', 'Design · Member', 'bg-amber-100 text-amber-700']].map(([initials, name, role, tone]) => <div key={name} className="flex items-center gap-2"><span className={'flex h-6 w-6 items-center justify-center rounded-full text-[7px] font-bold ' + tone}>{initials}</span><div><p className="text-[8px] font-semibold">{name}</p><p className="text-[7px] text-slate-400">{role}</p></div><ArrowRight className="ml-auto text-slate-300" size={10} /></div>)}</div></div>;
}
function PayrollCard() {
  return <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex items-center justify-between"><span className="text-[9px] font-semibold">Payroll review</span><span className="rounded-full bg-amber-50 px-2 py-1 text-[7px] font-medium text-amber-700">Needs review</span></div><p className="mt-3 text-[7px] text-slate-400">Upcoming pay run · 30 October</p><div className="mt-1 flex items-end justify-between"><strong className="text-lg font-bold">$48,920</strong><span className="text-[8px] text-slate-500">38 employees</span></div><div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 w-3/4 rounded-full bg-indigo-500" /></div><p className="mt-1.5 text-[7px] text-slate-400">29 of 38 records reviewed</p></div>;
}
function CommunicationsCard() {
  return <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex items-center justify-between"><span className="text-[9px] font-semibold">Team updates</span><span className="rounded-full bg-indigo-50 px-2 py-1 text-[7px] text-indigo-700">Company-wide</span></div><div className="mt-3 rounded-lg bg-slate-50 p-2.5"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[7px] font-bold text-violet-700">HR</span><div><p className="text-[8px] font-semibold">October all-hands</p><p className="text-[7px] text-slate-400">People team · 10 min ago</p></div></div><p className="mt-2 text-[8px] leading-relaxed text-slate-500">The monthly team update is ready for review before sharing.</p></div><div className="mt-2 flex items-center gap-1 text-[7px] text-indigo-600"><Sparkles size={9} /> Draft and organize team communications</div></div>;
}

/** Dot shape per feature card: people, calendar, envelope, chat, check, layers, briefcase, sparkle. */
const FEATURE_SHAPES = [3, 5, 7, 8, 2, 9, 6, 1];

/** Places the shape in the empty top corner of the card's text half (the halves alternate sides). */
function featureShape(index: number, formed: boolean): ParticleShape {
  const textOnRight = index % 2 === 0;
  return { index: formed ? FEATURE_SHAPES[index % FEATURE_SHAPES.length] : null, x: textOnRight ? 0.9 : 0.4, y: 0.17, size: 0.17 };
}

const featureItems = [
  { n: '01', icon: BriefcaseBusiness, title: 'Recruit with a clearer signal', text: 'Review a ranked shortlist, understand why each profile matches a role, and keep the hiring team in control of every decision.', tags: ['Resume matching', 'Role pipelines', 'Interview planning'], visual: <HiringCard /> },
  { n: '02', icon: Clock3, title: 'Make people ops easier', text: 'Bring attendance, time off, employee updates, and onboarding tasks together in one shared workspace.', tags: ['Attendance', 'Leave requests', 'Onboarding'], visual: <PeopleCard /> },
  { n: '03', icon: Inbox, title: 'Move from email to action', text: 'Connect Gmail, organize HR conversations, and prepare replies with an assistant that keeps your team in the loop.', tags: ['Gmail inbox', 'Reply drafts', 'Follow-ups'], visual: <EmailCard /> },
  { n: '04', icon: BookOpenText, title: 'Give every answer a source', text: 'Let your team ask about company policies and find answers linked to relevant knowledge base material.', tags: ['HR Copilot', 'Knowledge base', 'Source links'], visual: <KnowledgeCard /> },
  { n: '05', icon: Workflow, title: 'Keep work moving together', text: 'Track team tasks across a visual board, open each ticket for details, and move work through your process.', tags: ['Task board', 'Ticket details', 'Team workflow'], visual: <TasksCard /> },
  { n: '06', icon: Users, title: 'Know your people and teams', text: 'Keep employee information and reporting relationships organized, with onboarding steps easy to follow.', tags: ['Employee directory', 'Hierarchy', 'Onboarding'], visual: <EmployeeCard /> },
  { n: '07', icon: Clock3, title: 'Review attendance and payroll', text: 'Bring attendance reporting and payroll workflows into the same operational view for HR and managers.', tags: ['Attendance reports', 'Payroll', 'Admin review'], visual: <PayrollCard /> },
  { n: '08', icon: MessageSquareText, title: 'Keep the team in sync', text: 'Support HR communications, shared updates, and guided email drafting across day-to-day work.', tags: ['Team updates', 'Email assistance', 'Smart drafting'], visual: <CommunicationsCard /> },
];

function HomeContent() {
  const { loginAsGuest, isLoading } = useAuth();
  const [active, setActive] = useState<PreviewKey>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const startWorkspace = () => loginAsGuest();
  // Hero dots take the shape of each workflow step in turn, and that step lights up.
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const { step: heroStep, shape: heroShape } = useHeroWorkflowShapes(heroRef, heroTitleRef);
  // Which feature cards have settled into view, so their dot shape can form.
  const [featureFormed, setFeatureFormed] = useState<boolean[]>([]);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('#features article'));
    let frame = 0;
    const update = () => {
      frame = 0;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const formed = cards.map((card, index) => {
        const bounds = card.getBoundingClientRect();
        // 0 while below the fold, 1 once well in view. Tied to position, so scrolling up reverses it.
        const raw = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight * 0.8)));
        const progress = reduced ? 1 : 1 - Math.pow(1 - raw, 3);
        // Alternate sides: even cards sweep in from the left, odd from the right.
        const side = index % 2 === 0 ? -1 : 1;
        card.style.setProperty('--card-scale', String(0.78 + progress * 0.22));
        card.style.setProperty('--card-lift', (1 - progress) * 70 + 'px');
        card.style.setProperty('--card-x', side * (1 - progress) * 22 + 'vw');
        card.style.setProperty('--card-tilt', side * (1 - progress) * -4 + 'deg');
        card.style.setProperty('--card-fade', String(0.15 + progress * 0.85));
        // The heading flip and copy rise play as the card lands, and reset once it has left,
        // so they replay every time it comes back into view (scrolling down or up).
        if (raw > 0.7 && bounds.bottom > 0) card.classList.add('tile-text-revealed');
        else if (raw < 0.15 || bounds.bottom < 0) card.classList.remove('tile-text-revealed');
        // Dots form the card's shape once it has settled, and scatter when it leaves view.
        return raw > 0.92 && bounds.bottom > window.innerHeight * 0.25;
      });
      setFeatureFormed((current) => (current.length === formed.length && current.every((value, i) => value === formed[i]) ? current : formed));
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, []);


  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section:not(#platform):not(#product-tour):not(#agent-journey)'));
    const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-preview-step]'));
    if (typeof IntersectionObserver === 'undefined') {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }

    sections.forEach((section) => {
      section.classList.add('scroll-reveal');
      section.querySelectorAll<HTMLElement>('[data-reveal-item]').forEach((item, index) => {
        item.style.setProperty('--reveal-delay', String(index * 100) + 'ms');
      });
      const bounds = section.getBoundingClientRect();
      if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
        section.classList.add('is-visible');
      } else {
        section.classList.add('is-pending');
      }
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    sections.filter((section) => !section.classList.contains('is-visible')).forEach((section) => revealObserver.observe(section));

    const stepObserver = new IntersectionObserver((entries) => {
      const visibleSteps = entries.filter((entry) => entry.isIntersecting);
      if (!visibleSteps.length) return;
      const viewportCenter = window.innerHeight / 2;
      visibleSteps.sort((a, b) => {
        const aCenter = a.boundingClientRect.top + a.boundingClientRect.height / 2;
        const bCenter = b.boundingClientRect.top + b.boundingClientRect.height / 2;
        return Math.abs(aCenter - viewportCenter) - Math.abs(bCenter - viewportCenter);
      });
      const nextPreview = visibleSteps[0].target.getAttribute('data-preview-step') as PreviewKey | null;
      if (nextPreview) setActive(nextPreview);
    }, { threshold: 0, rootMargin: '-38% 0px -38% 0px' });
    steps.forEach((step) => stepObserver.observe(step));

    return () => {
      revealObserver.disconnect();
      stepObserver.disconnect();
    };
  }, []);
  return <div className="min-h-screen overflow-x-clip bg-[#080a12] text-white selection:bg-indigo-300 selection:text-slate-950">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a12]/90 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8"><Link href="/" aria-label="HR Streamline AI home" className="flex items-center gap-2.5"><Logo className="h-9 w-9" /><span className="text-[15px] font-bold tracking-tight sm:text-lg">HR Streamline <span className="text-indigo-300">AI</span></span></Link><nav className="hidden items-center gap-7 text-[13px] text-slate-300 lg:flex"><a href="#platform" className="transition hover:text-white">Platform</a><a href="#features" className="transition hover:text-white">Features</a><a href="#how-it-works" className="transition hover:text-white">How it works</a><Link href="/blog" className="transition hover:text-white">Resources</Link><Link href="/docs" className="transition hover:text-white">Docs</Link></nav><div className="hidden items-center gap-3 sm:flex"><Link href="/login" className="px-3 py-2 text-sm text-slate-300 transition hover:text-white">Log in</Link><Button onClick={startWorkspace} disabled={isLoading} className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 hover:bg-indigo-100">{isLoading ? 'Opening…' : 'Try the workspace'}<ArrowRight className="ml-2 h-4 w-4" /></Button></div><button aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} className="rounded-lg border border-white/15 p-2 sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button></div>{menuOpen && <div className="border-t border-white/10 bg-[#080a12] px-5 py-4 sm:hidden"><div className="grid gap-3 text-sm text-slate-300"><a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a><a href="#features" onClick={() => setMenuOpen(false)}>Features</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><Link href="/blog">Resources</Link><Link href="/docs" onClick={() => setMenuOpen(false)}>Docs</Link><Link href="/login">Log in</Link><Button onClick={startWorkspace} disabled={isLoading} className="mt-1 w-full rounded-full bg-white text-slate-950">Try the workspace</Button></div></div>}</header>
    <main>
      <section ref={heroRef} id="platform" className="dark-dot-surface relative isolate overflow-hidden bg-[#08090e]" onPointerMove={trackPointer} onPointerLeave={clearPointer}>
        <ParticleField shape={heroShape} />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[520px] w-[850px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-col items-center px-5 pb-14 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
          <span className="hero-intro inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/[0.06] px-4 py-2 text-xs font-medium text-violet-200"><Sparkles size={14} /> The agentic HR platform</span>
          <h1 ref={heroTitleRef} className="hero-intro mt-7 max-w-[1050px] text-[clamp(2.8rem,6.8vw,6.3rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Your HR workflows,<br /><span className="bg-gradient-to-r from-indigo-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">connected by AI.</span></h1>
          <p className="hero-intro mt-6 max-w-[740px] text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">Recruiting, onboarding, attendance, and payroll in one workspace—with a Copilot that helps your team find answers in your own policies.</p>
          <div className="relative mt-12 grid w-full max-w-[940px] grid-cols-2 items-center gap-6 sm:mt-16 sm:grid-cols-[1fr_1fr_1.4fr_1fr_1fr] sm:gap-4">
            <div aria-hidden="true" className="workflow-line absolute left-[8%] right-[8%] top-7 hidden h-px bg-white/15 sm:block" />
            {[{ label: 'Recruit', icon: Users }, { label: 'Onboard', icon: BadgeCheck }].map(({ label, icon: Icon }, index) => <div key={label} className={'workflow-node relative flex flex-col items-center gap-3' + (heroStep === index ? ' is-current' : '')} style={{ animationDelay: index * 0.6 + 's' }}><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0c0d16]"><Icon size={23} strokeWidth={1.5} /></span><span className="text-xs text-slate-400 sm:text-sm">{label}</span></div>)}
            <div className="relative col-span-2 row-start-1 flex flex-col items-center sm:col-span-1 sm:col-start-3 sm:row-auto"><span className="flex h-14 items-center gap-2 bg-[#08090e] px-6">{[0, 1, 2].map((i) => <span key={i} className="agent-signal h-2.5 w-2.5 rounded-full bg-indigo-400" style={{ animationDelay: i * 0.3 + 's' }} />)}</span><span className="mt-3 text-xs text-slate-500">AI connects the workflow</span><span className="mt-3 rounded-full border border-violet-300/30 bg-gradient-to-r from-indigo-500/15 to-fuchsia-500/15 px-4 py-2 text-xs font-medium text-violet-200">HR Streamline AI</span></div>
            {[{ label: 'Attendance', icon: CalendarDays }, { label: 'Payroll', icon: BriefcaseBusiness }].map(({ label, icon: Icon }, index) => <div key={label} className={'workflow-node relative flex flex-col items-center gap-3' + (heroStep === index + 2 ? ' is-current' : '')} style={{ animationDelay: (index + 2) * 0.6 + 's' }}><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0c0d16]"><Icon size={23} strokeWidth={1.5} /></span><span className="text-xs text-slate-400 sm:text-sm">{label}</span></div>)}
          </div>
          <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"><Button onClick={startWorkspace} disabled={isLoading} className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-slate-950 hover:bg-indigo-100">{isLoading ? 'Opening workspace…' : 'Explore the workspace'}<ArrowRight className="ml-2 h-4 w-4" /></Button><Link href="/book-a-demo" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-7 text-sm font-medium text-white transition hover:bg-white/5">Book a demo<ArrowUpRight size={15} /></Link></div>
          <a href="#product-tour" className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 transition hover:text-white">See the platform in action <span className="scroll-cue" aria-hidden="true">↓</span></a>
        </div>
      </section>
      <ProductTour active={active} onChange={setActive} />
      <section id="features" className="light-dot-surface relative isolate bg-[#f7f8fc] py-20 text-slate-900 sm:py-28"><ParticleField tone="dark" /><div className="mx-auto max-w-[1320px] px-5 sm:px-8"><div className="mx-auto max-w-[720px] text-center"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">A closer look</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">See the work your platform brings together.</h2><p className="mx-auto mt-4 max-w-[620px] text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">Explore the modules that support an employee’s journey—from hiring and onboarding to payroll, everyday questions, and team workflows. Previews use sample workspace data.</p></div><div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-6">{featureItems.map(({ n, icon: Icon, title, text, tags, visual }, index) => <article key={n} data-reveal-item className={'group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)] transition hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)] ' + (index < 2 ? 'lg:col-span-3' : 'lg:col-span-2')}><div className="flex min-h-[230px] items-center justify-center border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 p-5 sm:min-h-[255px] sm:p-7"><div className="w-full max-w-[430px]">{visual}</div></div><div className="p-5 sm:p-7"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={17} /></span><span className="text-[10px] font-semibold tracking-[0.14em] text-slate-400">{n}</span></div><h3 className="mt-4 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-2 max-w-[550px] text-[13px] leading-6 text-slate-500">{text}</p><div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-medium text-slate-600">{tag}</span>)}</div></div><ParticleField tone="dark" shape={featureShape(index, Boolean(featureFormed[index]))} /></article>)}</div></div></section>
      <ConnectedIntelligence />
      <AgentProcess />
      <section className="light-dot-surface relative isolate bg-white py-20 text-slate-900 sm:py-24"><ParticleField tone="dark" /><div className="mx-auto grid max-w-[1320px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"><div><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><ShieldCheck size={20} /></span><p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">Built for clarity</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">People decisions deserve context.</h2><p className="mt-4 max-w-[500px] text-sm leading-7 text-slate-500">From candidate recommendations to policy answers, keep the reasoning visible and give your team a clear place to review what happens next.</p><Link href="/knowledge-base" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900">Explore the knowledge base<ArrowRight size={15} /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[{ icon: FileText, title: 'Answers tied to sources', text: 'Give employees policy guidance they can check against the original material.' }, { icon: Users, title: 'People in the loop', text: 'Keep managers and HR in control of approvals, hiring, and communication.' }, { icon: Workflow, title: 'Workflows that connect', text: 'Move requests and tasks forward without losing track of ownership.' }, { icon: ShieldCheck, title: 'Workspace-level access', text: 'Organize HR resources and activity within your team workspace.' }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-slate-200 p-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-indigo-600"><Icon size={16} /></span><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1.5 text-[11px] leading-5 text-slate-500">{text}</p></div>)}</div></div></section>
      <section className="light-dot-surface relative isolate bg-[#f7f8fc] py-20 text-slate-900 sm:py-24"><ParticleField tone="dark" /><div className="mx-auto max-w-[900px] px-5 sm:px-8"><div className="text-center"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">Common questions</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">A few things you might be wondering.</h2></div><Accordion type="single" collapsible className="mt-8 divide-y divide-slate-200 border-y border-slate-200">{[{ q: 'What does HR Streamline include?', a: 'The workspace brings together recruitment, employee support, attendance, payroll, onboarding, Gmail inbox assistance, team communications, a knowledge base, and task workflows.' }, { q: 'How does the AI help the HR team?', a: 'AI can help review resumes, summarize context, draft email replies, and answer questions using your knowledge base. Your team reviews important decisions and messages.' }, { q: 'Which integrations are available?', a: 'The platform includes Gmail and Google Calendar connections. Integration availability depends on the configuration of your workspace.' }, { q: 'Can I explore the workspace?', a: 'Use the “Try the workspace” button to open the available guest workspace, or book a demo to discuss your team’s needs.' }].map(({ q, a }, i) => <AccordionItem key={q} value={'item-' + i} className="border-0"><AccordionTrigger className="py-5 text-left text-sm font-semibold hover:no-underline">{q}</AccordionTrigger><AccordionContent className="max-w-[760px] pb-5 text-[13px] leading-6 text-slate-500">{a}</AccordionContent></AccordionItem>)}</Accordion></div></section>
      <AgentJourney onStart={startWorkspace} loading={isLoading} />
    </main>
    <footer className="border-t border-white/10 bg-[#080a12] text-slate-400"><div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><Link href="/" className="flex items-center gap-2"><Logo className="h-8 w-8" /><span className="font-semibold text-white">HR Streamline AI</span></Link><p className="mt-3 max-w-[280px] text-[11px] leading-5">A connected workspace for recruiting, people operations, and employee support.</p></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">Platform</p><div className="mt-3 grid gap-2.5 text-[11px]"><a href="#features" className="hover:text-white">Features</a><Link href="/recruitment" className="hover:text-white">Recruitment</Link><Link href="/knowledge-base" className="hover:text-white">Knowledge base</Link><Link href="/tasks" className="hover:text-white">Task board</Link></div></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">Resources</p><div className="mt-3 grid gap-2.5 text-[11px]"><Link href="/blog" className="hover:text-white">Blog</Link><Link href="/docs" className="hover:text-white">Documentation</Link><Link href="/integrations" className="hover:text-white">Integrations</Link><Link href="/contact" className="hover:text-white">Contact</Link></div></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">Get started</p><div className="mt-3 grid gap-2.5 text-[11px]"><Link href="/login" className="hover:text-white">Log in</Link><button onClick={startWorkspace} className="w-fit hover:text-white">Try the workspace</button><Link href="/legal/privacy" className="hover:text-white">Privacy</Link><Link href="/legal/terms" className="hover:text-white">Terms</Link></div></div></div><div className="border-t border-white/10"><div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-5 py-4 text-[10px] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} HR Streamline AI</span><span>Built to help your people team do its best work.</span></div></div></footer>
    <button type="button" aria-label="Open HR Copilot" onClick={() => setChatOpen(true)} className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500"><MessageSquareText size={17} /><span className="hidden sm:inline">Ask HR Copilot</span></button>
    <CopilotSidebar isOpen={chatOpen} onOpenChange={setChatOpen} />
  </div>;
}

export default function HomePage() {
  return <HomeContent />;
}
