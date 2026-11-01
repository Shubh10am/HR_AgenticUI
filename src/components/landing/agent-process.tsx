'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, FileText, MessageSquareText, Sparkles } from 'lucide-react';
import ParticleField from './particle-field';

const steps = [
  { title: 'Find the right context.', text: 'Bring candidate details, employee requests, messages, and policies into view.', icon: MessageSquareText, label: 'Context gathered' },
  { title: 'Prepare the next step.', text: 'Summarize information, draft a reply, or highlight a task that needs attention.', icon: Sparkles, label: 'Draft prepared' },
  { title: 'Your team makes the call.', text: 'Review the details and decide what to approve, send, update, or assign next.', icon: BadgeCheck, label: 'Ready for human review' },
];

export default function AgentProcess() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearInterval(timer);
      if (entry.isIntersecting && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = setInterval(() => setActive((step) => (step + 1) % 3), 3600);
      }
    }, { threshold: 0.25 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); if (timer) clearInterval(timer); };
  }, []);
  return <section ref={root} id="how-it-works" className="agent-process">
    <ParticleField />
    <div className="agent-process-inner">
      <div className="agent-process-heading"><div><p className="agent-scene-label">Designed for useful AI</p><h2>Helpful at every step.<br /><span>Your team stays in charge.</span></h2></div><p>From context to a useful draft, the agent helps with the preparation. Your team reviews important decisions before acting.</p></div>
      <div className="agent-process-rail" aria-hidden="true"><span style={{ left: (active * 33.33 + 16.66) + '%' }}><Sparkles size={18} /></span></div>
      <div className="agent-process-grid">{steps.map(({ title, text, icon: Icon, label }, index) => <button key={title} onClick={() => setActive(index)} aria-pressed={active === index} className={'agent-process-card ' + (active === index ? 'is-active' : '')}>
        <div className="agent-process-card-top"><span>0{index + 1}</span><Icon size={22} /></div>
        <div className="agent-process-visual" aria-hidden="true">
          {index === 0 && <div className="process-documents">{['Employee request', 'Company policy', 'Team context'].map((name, i) => <div key={name} style={{ transform: 'translateX(' + (i * 7) + 'px)' }}><FileText size={15} /><span>{name}</span><Check size={12} /></div>)}</div>}
          {index === 1 && <div className="process-draft"><span><Sparkles size={14} /> AI-assisted draft</span><i /><i /><i /><div>Prepared for your review</div></div>}
          {index === 2 && <div className="process-review"><span><BadgeCheck size={24} /></span><strong>Review before moving forward</strong><div><span>Edit draft</span><span><Check size={11} /> Review</span></div></div>}
        </div>
        <h3>{title}</h3><p>{text}</p><div className="agent-process-status"><span />{label}</div>
      </button>)}</div>
      <p className="agent-process-caption">Illustrative workflow · Select a step to explore</p>
    </div>
  </section>;
}
