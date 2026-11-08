'use client';

import { useState, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import CopilotMascot from '@/components/copilot-mascot';
import { COPILOT_STARTERS, askCopilot } from '@/lib/copilot-events';
import { cn } from '@/lib/utils';

/** The dashboard's question box: type a question (or pick a starter) and Copilot answers in its panel. */
export default function AskCopilot() {
  const [question, setQuestion] = useState('');
  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    askCopilot(trimmed);
    setQuestion('');
  };
  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(question);
    }
  };

  return (
    <section id="dashboard-ask-copilot" aria-labelledby="dashboard-ask-copilot-title" className="flex flex-col items-center px-2 py-4 text-center sm:py-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border bg-background shadow-sm">
        <CopilotMascot className="h-14 w-11" />
      </span>
      <h2 id="dashboard-ask-copilot-title" className="mt-4 font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
        What do you want <em className="text-primary">to know?</em>
      </h2>
      <form
        className="mt-6 w-full max-w-2xl rounded-2xl border bg-card text-left shadow-sm transition-shadow focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/10"
        onSubmit={(event) => {
          event.preventDefault();
          send(question);
        }}
      >
        <label htmlFor="dashboard-ask-copilot-input" className="sr-only">Ask Copilot</label>
        <textarea
          id="dashboard-ask-copilot-input"
          rows={2}
          maxLength={1000}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about your leave, approvals, policies or anything HR…"
          className="block w-full resize-none rounded-t-2xl bg-transparent px-4 pt-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
          <p className="text-xs text-muted-foreground">Answers use your own records and company documents</p>
          <button
            id="dashboard-ask-copilot-send"
            type="submit"
            aria-label="Ask Copilot"
            disabled={!question.trim()}
            className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors', question.trim() ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground')}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
      <div className="mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
        {COPILOT_STARTERS.map((starter, index) => (
          <button
            key={starter}
            id={`dashboard-ask-copilot-starter-${index}`}
            type="button"
            onClick={() => send(starter)}
            className="rounded-full border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {starter}
          </button>
        ))}
      </div>
    </section>
  );
}
