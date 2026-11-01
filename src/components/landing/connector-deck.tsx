'use client';

import { useEffect, useRef, useState } from 'react';
import ParticleField from './particle-field';
import { ArrowRight, FileText, GitBranch, MessageSquareText, Sparkles } from 'lucide-react';

const groups = [
  { name: 'Conversations', icon: MessageSquareText, text: 'Follow project discussions, decisions, and the topics your team is talking about.', tools: [{ name: 'Slack', domain: 'slack.com' }, { name: 'Teams', domain: 'teams.microsoft.com' }, { name: 'Gmail', domain: 'mail.google.com' }, { name: 'Outlook', domain: 'outlook.com' }] },
  { name: 'Work & code', icon: GitBranch, text: 'Bring tickets, pull requests, reviews, and project boards into a shared picture of progress.', tools: [{ name: 'Jira', domain: 'atlassian.com' }, { name: 'GitHub', domain: 'github.com' }] },
  { name: 'Team knowledge', icon: FileText, text: 'Connect the documents, plans, and decisions that explain the work behind an update.', tools: [{ name: 'Confluence', domain: 'confluence.atlassian.com' }, { name: 'Notion', domain: 'notion.so' }, { name: 'Google Drive', domain: 'drive.google.com' }] },
  { name: 'Your workspace', icon: Sparkles, text: 'Bring shared files, schedules, and collaboration context into the same Copilot conversation.', tools: [{ name: 'Google Workspace', domain: 'workspace.google.com' }, { name: 'Microsoft 365', domain: 'microsoft.com' }, { name: 'Google Calendar', domain: 'calendar.google.com' }] },
];

export default function ConnectorDeck() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [flipped, setFlipped] = useState<number | null>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!root.current) return;
      const bounds = root.current.getBoundingClientRect();
      const progress = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight * 0.85)));
      root.current.style.setProperty('--deck-open', String(progress));
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, []);
  const group = groups[selected];
  return <div ref={root} className="connector-deck-showcase"><ParticleField />
    <div className="connector-deck-heading"><span>Many tools. One connected perspective.</span><p>Explore the connector cards</p></div>
    <div className="connector-deck" aria-label="Explore connector categories">{groups.map(({ name, icon: Icon, tools, text }, index) => <button key={name} className={'connector-playing-card connector-playing-card-' + index + (selected === index ? ' is-selected' : '') + (flipped === index ? ' is-flipped' : '')} onClick={() => { setSelected(index); setFlipped(flipped === index ? null : index); }} aria-pressed={selected === index} aria-label={name + ': ' + text}>
      <div className="connector-card-flipper"><div className="connector-card-front">
      <div className="connector-card-frame" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="connector-card-corner"><span>0{index + 1}</span><Icon size={18} /></div>
      <div className="connector-card-seal"><Icon size={34} strokeWidth={1.2} /><span className="connector-seal-ring" /></div>
      <div className="connector-card-name">{name}</div>
      <div className="connector-card-logos">{tools.map((tool) => <span key={tool.name} title={tool.name}><img src={'https://www.google.com/s2/favicons?domain=' + tool.domain + '&sz=64'} alt={tool.name} width={24} height={24} loading="lazy" /></span>)}</div>
      <span className="connector-card-footer">HR STREAMLINE <Sparkles size={12} /> CONNECTED INTELLIGENCE</span>
      </div><div className="connector-card-back"><Icon size={25} strokeWidth={1.4} /><span className="connector-back-label">Connected context</span><h3>{name}</h3><p>{text}</p><div className="connector-back-tools">{tools.map((tool) => <span key={tool.name}><img src={'https://www.google.com/s2/favicons?domain=' + tool.domain + '&sz=64'} alt="" width={16} height={16} loading="lazy" />{tool.name}</span>)}</div><span className="connector-back-hint">Select to explore · Tap again to turn back</span></div></div>
    </button>)}</div>
    <div className="connector-deck-detail" key={selected}><div><span className="connector-deck-detail-label">{group.name}</span><p>{group.text}</p></div><div className="connector-deck-tool-list">{group.tools.map((tool) => <span key={tool.name}><img src={'https://www.google.com/s2/favicons?domain=' + tool.domain + '&sz=64'} alt="" width={18} height={18} loading="lazy" />{tool.name}</span>)}</div></div>
    <div className="connector-deck-destination"><span className="connector-deck-line" /><span><Sparkles size={16} /> Context for your Copilot <ArrowRight size={14} /></span><span className="connector-deck-line" /></div>
  </div>;
}
