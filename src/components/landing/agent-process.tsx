'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useScrollSteps } from '@/hooks/use-scroll-steps';
import { BadgeCheck, Check, FileText, MessageSquareText, Sparkles } from 'lucide-react';
import ParticleField, { type ParticleShape } from './particle-field';

const steps = [
  { title: 'Find the right context.', text: 'Bring candidate details, employee requests, messages, and policies into view.', icon: MessageSquareText, label: 'Context gathered' },
  { title: 'Prepare the next step.', text: 'Summarize information, draft a reply, or highlight a task that needs attention.', icon: Sparkles, label: 'Draft prepared' },
  { title: 'Your team makes the call.', text: 'Review the details and decide what to approve, send, update, or assign next.', icon: BadgeCheck, label: 'Ready for human review' },
];

export default function AgentProcess() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Wide screens: the section pins and scrolling walks through the steps.
  const { trackRef, active: scrollStep, enabled: scrollDriven, trackStyle, goTo } = useScrollSteps(steps.length);
  const [timedStep, setTimedStep] = useState(0);
  const active = scrollDriven ? scrollStep : timedStep;
  const setActive = scrollDriven ? goTo : setTimedStep;

  // The background dots gather into this step's shape in the open space of the heading row.
  const heading = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<ParticleShape>({ index: 0, x: 0.55, y: 0.2, size: 0.18 });
  useLayoutEffect(() => {
    const measure = () => {
      const row = heading.current;
      const box = stage.current;
      const title = row?.querySelector('h2');
      const copy = row?.querySelector(':scope > p');
      if (!row || !box || !title || !copy) return;
      const b = box.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      // Width of the title's longest line, not its column.
      const range = document.createRange();
      range.selectNodeContents(title);
      const textRight = Math.max(...[...range.getClientRects()].map((rect) => rect.right));
      const gapLeft = textRight;
      const gapRight = copy.getBoundingClientRect().left;
      const side = Math.min(Math.max(gapRight - gapLeft, 0) * 0.95, r.height * 1.05, 240);
      const wide = gapRight - gapLeft > 120;
      setShape({
        index: active,
        x: wide ? ((gapLeft + gapRight) / 2 - b.left) / b.width : 0.84,
        // Keep the shape clear of the fixed navigation bar (about 80px) while the section is pinned.
        y: wide ? (Math.max(r.top + r.height / 2, b.top + 90 + side / 2) - b.top) / b.height : 0.12,
        size: (wide ? side : 150) / Math.min(b.width, b.height * 1.6),
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, scrollDriven]);

  // Phones and reduced motion: no pinning, so step through on a timer instead.
  useEffect(() => {
    if (scrollDriven) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearInterval(timer);
      if (entry.isIntersecting && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = setInterval(() => setTimedStep((step) => (step + 1) % 3), 3600);
      }
    }, { threshold: 0.25 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); if (timer) clearInterval(timer); };
  }, [scrollDriven]);
  return <section ref={root} id="how-it-works" className="agent-process">
    <div ref={trackRef} style={trackStyle} className={scrollDriven ? 'agent-process-track' : undefined}><div ref={stage} className="agent-process-stage">
    <ParticleField shape={shape} />
    <div className="agent-process-inner">
      <div ref={heading} className="agent-process-heading"><div><p className="agent-scene-label">Designed for useful AI</p><h2>Helpful at every step.<br /><span>Your team stays in charge.</span></h2></div><p>From context to a useful draft, the agent helps with the preparation. Your team reviews important decisions before acting.</p></div>
      <div className="agent-process-rail" aria-hidden="true"><span style={{ left: (active * 33.33 + 16.66) + '%' }}><Sparkles size={18} /></span></div>
      <div className="agent-process-grid">{steps.map(({ title, text, icon: Icon, label }, index) => <button key={title} id={`agent-process-step-${index}`} onClick={() => setActive(index)} aria-pressed={active === index} className={'agent-process-card ' + (active === index ? 'is-active' : '')}>
        <div className="agent-process-card-top"><span>0{index + 1}</span><Icon size={22} /></div>
        <div className="agent-process-visual" aria-hidden="true">
          {index === 0 && <div className="process-documents">{['Employee request', 'Company policy', 'Team context'].map((name, i) => <div key={name} style={{ transform: 'translateX(' + (i * 7) + 'px)' }}><FileText size={15} /><span>{name}</span><Check size={12} /></div>)}</div>}
          {index === 1 && <div className="process-draft"><span><Sparkles size={14} /> AI-assisted draft</span><i /><i /><i /><div>Prepared for your review</div></div>}
          {index === 2 && <div className="process-review"><span><BadgeCheck size={24} /></span><strong>Review before moving forward</strong><div><span>Edit draft</span><span><Check size={11} /> Review</span></div></div>}
        </div>
        <h3>{title}</h3><p>{text}</p><div className="agent-process-status"><span />{label}</div>
      </button>)}</div>
      <p className="agent-process-caption">Illustrative workflow · {scrollDriven ? 'Scroll or select a step to explore' : 'Select a step to explore'}</p>
    </div>
    </div></div>
  </section>;
}
