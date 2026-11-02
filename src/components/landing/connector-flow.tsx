'use client';

import { useEffect, useRef, useState } from 'react';
import ParticleField from './particle-field';
import { useScrollSteps } from '@/hooks/use-scroll-steps';
import { ArrowRight, Check, Database, FileText, GitBranch, Link2, ShieldCheck, Sparkles } from 'lucide-react';

const stages = [
  { title: 'Connect your tools', detail: 'Bring the tools your team already uses into one workspace.', icon: Link2 },
  { title: 'Choose the scope', detail: 'Select the projects, channels, documents, and teams relevant to the question.', icon: ShieldCheck },
  { title: 'Gather the context', detail: 'Combine conversations, work items, code changes, and documents with their source references.', icon: Database },
  { title: 'Ask your Copilot', detail: 'Turn the connected context into a clear answer about progress, themes, or blockers.', icon: Sparkles },
  { title: 'Review and act', detail: 'Check the supporting evidence, add your own context, and decide the next step.', icon: Check },
];
const sources = [
  { name: 'Slack', domain: 'slack.com', note: 'Team discussions' },
  { name: 'Jira', domain: 'atlassian.com', note: 'Tickets & blockers' },
  { name: 'GitHub', domain: 'github.com', note: 'Code & reviews' },
  { name: 'Teams', domain: 'teams.microsoft.com', note: 'Project updates' },
  { name: 'Workspace', domain: 'workspace.google.com', note: 'Docs & decisions' },
];

export default function ConnectorFlow() {
  // Wide screens: the diagram pins and scrolling walks through the stages in order.
  const { trackRef, active: scrollStage, enabled: scrollDriven, trackStyle, goTo } = useScrollSteps(stages.length, 40);
  const [timedStage, setTimedStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = scrollDriven ? scrollStage : timedStage;
  const root = useRef<HTMLDivElement>(null);
  // Elsewhere (phones, reduced motion) it plays on a timer that can be paused.
  useEffect(() => {
    if (scrollDriven) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearInterval(timer);
      if (entry.isIntersecting && !paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => setTimedStage((step) => (step + 1) % stages.length), 1800);
    }, { threshold: .3 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); if (timer) clearInterval(timer); };
  }, [paused, scrollDriven]);
  const choose = (index: number) => {
    if (scrollDriven) return goTo(index);
    setTimedStage(index);
    setPaused(true);
  };
  return <div ref={trackRef} style={trackStyle} className={scrollDriven ? 'connector-map-track' : undefined}><div ref={root} className="connector-map"><ParticleField tone="dark" />
    <div className="connector-map-top"><div><span className="connected-eyebrow">From scattered updates to shared understanding</span><h3>Watch the context connect.</h3></div>{scrollDriven ? <span className="connector-map-progress" id="connector-flow-progress">Stage {active + 1} of {stages.length} · scroll to follow</span> : <button onClick={() => setPaused(!paused)} aria-label={paused ? 'Play connector flow' : 'Pause connector flow'}>{paused ? 'Play flow' : 'Pause flow'}<span className={paused ? '' : 'flow-live-dot'} /></button>}</div>
    <div className="connector-map-tabs" aria-label="Connector flow stages">{stages.map(({ title, icon: Icon }, index) => <button key={title} id={`connector-flow-stage-${index}`} aria-pressed={active === index} onClick={() => choose(index)}><span>0{index + 1}</span><Icon size={14} />{title}</button>)}</div>
    <div className={'connector-map-diagram flow-stage-' + active}>
      <div className="connector-source-stack">{sources.map((source) => <div key={source.name}><img src={'https://www.google.com/s2/favicons?domain=' + source.domain + '&sz=64'} alt="" width={23} height={23} loading="lazy" /><div><strong>{source.name}</strong><span>{source.note}</span></div><span className="connector-source-dot" /></div>)}</div>
      <div className="connector-wire connector-wire-merge" aria-hidden="true"><svg viewBox="0 0 140 300" preserveAspectRatio="none">{[30,90,150,210,270].map((y) => <path key={y} d={'M0 ' + y + ' C75 ' + y + ',55 150,140 150'} />)}</svg><span /></div>
      <div className={'connector-context-node ' + (active === 1 || active === 2 ? 'node-active' : '')}><span className="connector-node-icon"><ShieldCheck size={23} /></span><h4>Workspace context</h4><p>Selected sources<br />Relevant projects & teams</p><span className="connector-context-tag"><Database size={11} /> Linked evidence</span></div>
      <div className="connector-wire connector-wire-straight" aria-hidden="true"><span /></div>
      <div className={'connector-copilot-node ' + (active === 3 ? 'node-active' : '')}><span className="connector-copilot-orb"><Sparkles size={28} /></span><h4>HR Copilot</h4><p>Connect · Understand · Summarize</p></div>
      <div className="connector-wire connector-wire-straight" aria-hidden="true"><span /></div>
      <div className={'connector-answer-node ' + (active === 4 ? 'node-active' : '')}><span className="connector-answer-label"><Check size={13} /> Ready to review</span><h4>A clearer picture.</h4><div><GitBranch size={13} /><span>Progress & blockers</span></div><div><FileText size={13} /><span>Source references</span></div><div><ShieldCheck size={13} /><span>Your team’s decision</span></div></div>
    </div>
    <div className="connector-map-explanation" key={active}><span className="connector-map-step">0{active + 1}</span><div><h4>{stages[active].title}</h4><p>{stages[active].detail}</p></div><ArrowRight size={20} /></div>
    <p className="connector-map-caption">Illustrative connector flow · Explore a sample Copilot answer below</p>
  </div></div>;
}
