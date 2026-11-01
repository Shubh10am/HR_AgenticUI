'use client';

import { useState } from 'react';
import ConnectorDeck from './connector-deck';
import ConnectorFlow from './connector-flow';
import { ArrowRight, Check, FileText, GitBranch, Layers3, Link2, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';

const questions = [
  { question: 'What is the status of the platform?', title: 'A status update with the evidence attached.', answer: 'In this example, the onboarding release is in review. The API work is merged, testing is underway, and the team is waiting on a product decision.', sources: ['Jira · Release board', 'GitHub · Pull request', 'Teams · Project discussion'] },
  { question: 'What are the current hot topics and blockers?', title: 'Find the conversations that need attention.', answer: 'In this example, the main themes are onboarding reliability, a permissions issue, and next week’s release scope. Copilot groups related updates and points to the original discussion.', sources: ['Slack · Project channel', 'Confluence · Release notes', 'Jira · Blocked tickets'] },
  { question: 'Summarize a teammate’s contributions.', title: 'Review contributions in context.', answer: 'In this example, the summary brings together completed work, code reviews, documented decisions, and open dependencies. Managers verify the evidence and add context before any evaluation.', sources: ['GitHub · Code reviews', 'Jira · Completed work', 'Google Docs · Design decision'] },
];

export default function ConnectedIntelligence() {
  const [selected, setSelected] = useState(0);
  const response = questions[selected];
  return <section id="connected-intelligence" className="connected-intelligence">
    <div className="connected-inner">
      <div className="connected-heading"><span className="connected-planned">Connected work intelligence</span><h2>Your tools hold the context.<br /><span>Let your agent bring it together.</span></h2><p>A connected Copilot for project status, current discussions, blockers, and evidence-based contribution summaries—without asking everyone for another update.</p></div>
      <ConnectorDeck />
      <ConnectorFlow />
      <div className="connected-demo"><aside><span className="connected-eyebrow">Questions leaders can ask</span><h3>One question.<br />A connected picture.</h3><div>{questions.map((item, index) => <button key={item.question} aria-pressed={selected === index} onClick={() => setSelected(index)}><MessageSquareText size={17} /><span>{item.question}</span><ArrowRight size={14} /></button>)}</div><p><ShieldCheck size={14} /> Choose the workspace sources your Copilot can use, then review the supporting context with each answer.</p></aside>
        <div className="connected-response" key={selected}><div className="connected-response-top"><span><Sparkles size={16} /> Copilot</span><small>Illustrative response · sample data</small></div><h3>{response.title}</h3><p>{response.answer}</p><div className="connected-evidence"><span>Supporting sources</span>{response.sources.map((source, index) => <div key={source}>{index === 1 ? <GitBranch size={14} /> : <FileText size={14} />}<span>{source}</span><small>View context ↗</small></div>)}</div><div className="connected-review"><Check size={14} /><span>{selected === 2 ? 'Contribution evidence supports human review. Activity counts and message volume are not performance ratings.' : 'Check original sources, timestamps, and unresolved questions before acting.'}</span></div></div>
      </div>
      <div className="connected-principles"><span><Layers3 size={16} /> Status, themes, and dependencies</span><span><FileText size={16} /> Answers linked to source evidence</span><span><ShieldCheck size={16} /> People review employee evaluations</span></div>
      <p className="connected-disclosure">Connect the sources relevant to your workspace. The interactive preview above uses sample data to show how a connected answer is presented.</p>
    </div>
  </section>;
}
