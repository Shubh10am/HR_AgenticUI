'use client';

import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import type { DocSection } from '@/lib/docs/types';

interface DocsHomeProps {
  sections: DocSection[];
  onNavigate: (slug: string) => void;
}

/** Docs landing: what the platform is, then every module grouped by section. */
export default function DocsHome({ sections, onNavigate }: DocsHomeProps) {
  const moduleCount = sections.reduce((total, section) => total + section.pages.length, 0);
  return (
    <div className="max-w-5xl">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-accent/[0.06] to-transparent p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <span className="relative inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-xs font-medium text-primary">
          <BookOpen className="h-3.5 w-3.5" /> Documentation · {moduleCount} guides
        </span>
        <h1 className="relative mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">HR Streamline AI docs</h1>
        <p className="relative mt-4 max-w-2xl text-lg text-muted-foreground">
          Everything the platform offers and how to use it — from your first login to recruiting, attendance, payroll and the AI tools that draft, search and answer for your team.
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <button type="button" id="docs-home-start" onClick={() => onNavigate('quick-start')} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90">
            Quick start <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" id="docs-home-ai" onClick={() => onNavigate('ai-overview')} className="inline-flex h-11 items-center gap-2 rounded-full border bg-background px-6 text-sm font-medium hover:bg-secondary">
            <Sparkles className="h-4 w-4 text-primary" /> How the AI works
          </button>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.id} className="mt-12">
          <h2 className="font-display text-xl font-bold tracking-tight">{section.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.pages.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  key={page.slug}
                  type="button"
                  id={`docs-card-${page.slug}`}
                  onClick={() => onNavigate(page.slug)}
                  className="group flex flex-col rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <span className="mt-4 font-semibold">{page.title}</span>
                  <span className="mt-1 text-sm leading-relaxed text-muted-foreground">{page.summary}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">Read guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
