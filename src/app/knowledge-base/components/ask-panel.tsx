'use client';

import { useState, type FormEvent } from 'react';
import { BookOpenCheck, FileText, Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { knowledgeApi, type KnowledgeSearchResult } from '@/lib/knowledge-client';
import { cn } from '@/lib/utils';

const SUGGESTIONS = ['How many leave days do employees get?', 'What are the working hours?', 'What is the dress code?'];

interface AskPanelProps {
  token: string;
  onOpenSource: (sourceId: string) => void;
}

/** "Ask your knowledge base": a question box that answers only from the organization's documents, with sources. */
export default function AskPanel({ token, onOpenSource }: AskPanelProps) {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [result, setResult] = useState<KnowledgeSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (text: string) => {
    if (!text.trim()) return;
    setQuestion(text);
    setIsAsking(true);
    setError(null);
    try {
      setResult(await knowledgeApi.search(token, text, { answer: true, limit: 5 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setResult(null);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(question);
  };

  const sources = result ? [...new Map(result.passages.map((p) => [p.sourceId, p])).values()] : [];

  return (
    <section id="kb-ask-panel" className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-accent/[0.05] to-transparent p-5">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/30">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">Ask your knowledge base</h2>
          <p className="text-sm text-muted-foreground">Answers come only from your documents and policies, with sources. Copilot and AI email replies use the same knowledge.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="kb-ask-input"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is our notice period?"
            className="h-11 rounded-xl bg-background pl-9"
          />
        </div>
        <Button id="kb-ask-submit" type="submit" disabled={isAsking || !question.trim()} className="h-11 rounded-xl px-5">
          {isAsking ? <Loader2 className="animate-spin" /> : <Sparkles />} Ask
        </Button>
      </form>

      {!result && !isAsking && !error && (
        <div className="relative mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary">
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && <p className="relative mt-4 text-sm text-destructive">{error}</p>}

      {result && (
        <div id="kb-ask-answer" className="relative mt-4 rounded-xl border bg-background p-4">
          <p className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wider', result.isAnswered ? 'text-primary' : 'text-muted-foreground')}>
            <BookOpenCheck className="h-3.5 w-3.5" /> {result.isAnswered ? 'Answer' : 'Not found'}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p>
          {sources.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">Sources:</span>
              {sources.map((source, index) => (
                <button
                  key={source.sourceId}
                  type="button"
                  id={`kb-ask-source-${index}`}
                  onClick={() => onOpenSource(source.sourceId)}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <FileText className="h-3 w-3" /> [{index + 1}] {source.sourceName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
