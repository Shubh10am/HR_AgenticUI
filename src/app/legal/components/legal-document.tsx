import type { ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Lock, Mail, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  kind: 'privacy' | 'terms' | 'security';
  title: string;
  summary: string;
  lastUpdated: string;
  /** Short plain-language points shown before the full text. */
  keyPoints: string[];
  sections: LegalSection[];
  contactEmail: string;
}

const LEGAL_PAGES: { kind: LegalDocumentProps['kind']; href: string; label: string; icon: LucideIcon }[] = [
  { kind: 'privacy', href: '/legal/privacy', label: 'Privacy Policy', icon: Lock },
  { kind: 'terms', href: '/legal/terms', label: 'Terms of Service', icon: FileText },
  { kind: 'security', href: '/legal/security', label: 'Security', icon: ShieldCheck },
];

/** Shared layout for the legal pages: summary, key points, table of contents and numbered sections. */
export default function LegalDocument({ kind, title, summary, lastUpdated, keyPoints, sections, contactEmail }: LegalDocumentProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Legal pages" className="flex flex-wrap gap-2">
        {LEGAL_PAGES.map((page) => (
          <Link
            key={page.kind}
            href={page.href}
            id={`legal-tab-${page.kind}`}
            aria-current={page.kind === kind ? 'page' : undefined}
            className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors', page.kind === kind ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground/75 hover:border-primary/40 hover:text-primary')}
          >
            <page.icon className="h-4 w-4" /> {page.label}
          </Link>
        ))}
      </nav>

      <header className="mt-10 max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{summary}</p>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: <time>{lastUpdated}</time></p>
      </header>

      <section aria-labelledby="legal-key-points" className="mt-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-accent/[0.04] p-6">
        <h2 id="legal-key-points" className="font-semibold">The short version</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {keyPoints.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-foreground/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {point}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex gap-12">
        <aside className="sticky top-24 hidden h-fit w-60 shrink-0 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
          <ol className="mt-3 space-y-1 border-l">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="legal-content min-w-0 max-w-3xl flex-1">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 border-b pb-10 pt-2 last:border-0 [&+section]:mt-10">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                <span className="mr-2 text-primary/70">{index + 1}.</span>{section.title}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-foreground/80">{section.body}</div>
            </section>
          ))}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mail className="h-5 w-5" /></span>
              <div>
                <p className="font-semibold">Questions about this page?</p>
                <p className="text-sm text-muted-foreground">Email us and we will get back to you.</p>
              </div>
            </div>
            <a href={`mailto:${contactEmail}`} id={`legal-contact-${kind}`} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">{contactEmail}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
