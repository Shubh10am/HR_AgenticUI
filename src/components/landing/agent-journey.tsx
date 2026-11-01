'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpenText, BriefcaseBusiness, CalendarDays, Check, Inbox, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-react';
import ParticleField from './particle-field';
import BouncingShapes from './bouncing-shapes';

const scenes = [
  { label: '01 / Understand', title: 'Context comes first.', text: 'The journey starts with your team’s request and the information they choose to share.', message: 'Help me onboard our new teammate.', result: 'Request understood', icon: Users },
  { label: '02 / Prepare', title: 'A useful next step.', text: 'AI helps organize the context and prepare a draft your team can work with.', message: 'Preparing an onboarding checklist…', result: 'Draft ready for review', icon: Workflow },
  { label: '03 / Review', title: 'People make the call.', text: 'Your team reviews the draft, adjusts the details, and decides what happens next.', message: 'Review the plan before moving forward.', result: 'Waiting for your approval', icon: ShieldCheck },
  { label: 'Your people. Your platform.', title: 'Let’s move\nforward together.', text: 'Bring your people workflows into one connected workspace.', message: 'Ready for your team.', result: 'Explore HR Streamline AI', icon: Sparkles },
];
const modules = [
  { title: 'Recruitment', icon: BriefcaseBusiness }, { title: 'People', icon: Users },
  { title: 'Gmail inbox', icon: Inbox }, { title: 'Knowledge', icon: BookOpenText },
  { title: 'Attendance', icon: CalendarDays }, { title: 'Tasks', icon: Workflow },
];

export default function AgentJourney({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  const track = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = track.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      const distance = element.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(0.999, -bounds.top / Math.max(1, distance)));
      setScene(Math.min(3, Math.floor(progress * 4)));
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, []);
  const current = scenes[scene];
  const Icon = current.icon;
  return <section ref={track} id="agent-journey" className="agent-journey" aria-label="Illustrative HR agent journey">
    <div className={'agent-journey-stage ' + (scene === 3 ? 'is-finale' : '')}>
      <ParticleField />
      <BouncingShapes />
      <div className="agent-journey-glow" aria-hidden="true" />
      <div className="agent-journey-top"><span>Meet your HR sidekick</span><span>Illustrative workflow · Human review built in</span></div>
      <div className="agent-orbit" aria-hidden="true">{modules.map(({ title, icon: ModuleIcon }, index) => <div key={title} className={'agent-module agent-module-' + index}><ModuleIcon size={20} /><span>{title}</span></div>)}</div>
      <div className="agent-character" aria-hidden="true">
        <div className="agent-antenna"><span /></div>
        <div className="agent-head"><div className="agent-visor"><span /><span /></div><span className="agent-mouth" /></div>
        <div className="agent-body"><Sparkles size={26} /><span className="agent-status" /></div>
        <div className="agent-hand agent-hand-left" /><div className="agent-hand agent-hand-right" />
        <div className="agent-shadow" />
      </div>
      <div key={scene} className="agent-scene-copy">
        <p className="agent-scene-label">{current.label}</p>
        <h2>{current.title}</h2>
        <p className="agent-scene-description">{current.text}</p>
      </div>
      {scene < 3 ? <div key={'message-' + scene} className="agent-message"><span className="agent-message-icon"><Icon size={18} /></span><div><p>{current.message}</p><span><Check size={11} />{current.result}</span></div></div> : <div className="agent-finale-actions"><button onClick={onStart} disabled={loading}>{loading ? 'Opening…' : 'Explore the workspace'}<ArrowRight size={17} /></button><Link href="/book-a-demo">Book a demo ↗</Link></div>}
      <div className="agent-journey-bottom"><div className="agent-scene-progress">{scenes.map((item, index) => <span key={item.label} className={index <= scene ? 'is-complete' : ''} />)}</div><span>{scene === 3 ? 'Built for the people behind your business.' : 'Keep scrolling to follow the journey ↓'}</span></div>
    </div>
  </section>;
}
