'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, ExternalLink, Info, Lightbulb, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { DocCallout, DocPage } from '@/lib/docs/types';
import { DOC_SCREENSHOTS } from '@/lib/docs/screenshots';
import { cn } from '@/lib/utils';

/** Ids of the in-page sections, shared with the "On this page" outline. */
export function articleOutline(page: DocPage): { id: string; title: string }[] {
  return [
    { id: 'overview', title: 'Overview' },
    ...(page.features?.length ? [{ id: 'features', title: 'What you get' }] : []),
    ...(page.howTos ?? []).map((howTo) => ({ id: howTo.id, title: howTo.title })),
    ...(page.callouts?.length ? [{ id: 'good-to-know', title: 'Good to know' }] : []),
    ...(page.faqs?.length ? [{ id: 'faq', title: 'FAQ' }] : []),
  ];
}

const CALLOUT_STYLES: Record<DocCallout['tone'], { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-sky-500/30 bg-sky-500/5 [&_svg]:text-sky-600' },
  tip: { icon: Lightbulb, className: 'border-primary/30 bg-primary/5 [&_svg]:text-primary' },
  warning: { icon: AlertTriangle, className: 'border-amber-500/30 bg-amber-500/5 [&_svg]:text-amber-600' },
};

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="scroll-mt-24 font-display text-xl font-bold tracking-tight">{children}</h2>;
}

interface DocArticleProps {
  page: DocPage;
  sectionTitle: string;
  previous?: DocPage;
  next?: DocPage;
  onNavigate: (slug: string) => void;
}

/** Renders one module's documentation in a consistent structure. */
export default function DocArticle({ page, sectionTitle, previous, next, onNavigate }: DocArticleProps) {
  const Icon = page.icon;
  const screenshot = DOC_SCREENSHOTS[page.slug];
  return (
    <article className="max-w-3xl">
      <p className="text-sm font-medium text-primary">{sectionTitle}</p>
      <div className="mt-3 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/30">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{page.summary}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> {page.audience.join(' · ')}
        </span>
        {page.maturity === 'preview' && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">Preview — shows sample data</span>
        )}
        {page.route && (
          <Button asChild size="sm" variant="outline" className="ml-auto rounded-full" id={`docs-open-${page.slug}`}>
            <Link href={page.route}>Open {page.title} <ExternalLink /></Link>
          </Button>
        )}
      </div>

      {screenshot && (
        <figure className="mt-8" id={`docs-screenshot-${page.slug}`}>
          <a href={screenshot.src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border bg-muted shadow-lg shadow-primary/5 transition-shadow hover:shadow-xl" aria-label={`Open full-size screenshot of ${page.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static screenshots; next/image adds nothing here */}
            <img src={screenshot.src} alt={screenshot.alt} width={1600} height={1000} loading="lazy" className="h-auto w-full" />
          </a>
          <figcaption className="mt-2 text-sm text-muted-foreground">{screenshot.caption}</figcaption>
        </figure>
      )}

      <section className="mt-10 space-y-3">
        <SectionHeading id="overview">Overview</SectionHeading>
        {page.overview.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="leading-relaxed text-foreground/80">{paragraph}</p>
        ))}
      </section>

      {page.features && page.features.length > 0 && (
        <section className="mt-10">
          <SectionHeading id="features">What you get</SectionHeading>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {page.features.map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-card p-4">
                <p className="font-semibold">{feature.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {page.howTos?.map((howTo) => (
        <section key={howTo.id} className="mt-10">
          <SectionHeading id={howTo.id}>{howTo.title}</SectionHeading>
          <ol className="mt-4 space-y-4">
            {howTo.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {page.callouts && page.callouts.length > 0 && (
        <section className="mt-10">
          <SectionHeading id="good-to-know">Good to know</SectionHeading>
          <div className="mt-4 space-y-3">
            {page.callouts.map((callout) => {
              const style = CALLOUT_STYLES[callout.tone];
              const CalloutIcon = style.icon;
              return (
                <div key={callout.title} className={cn('flex gap-3 rounded-xl border p-4', style.className)}>
                  <CalloutIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">{callout.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/75">{callout.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {page.faqs && page.faqs.length > 0 && (
        <section className="mt-10">
          <SectionHeading id="faq">FAQ</SectionHeading>
          <Accordion type="single" collapsible className="mt-2">
            {page.faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left font-medium hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      <nav className="mt-14 grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Previous and next">
        {previous ? (
          <button type="button" id="docs-previous" onClick={() => onNavigate(previous.slug)} className="rounded-xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3 w-3" /> Previous</span>
            <span className="mt-1 block font-semibold">{previous.title}</span>
          </button>
        ) : <span />}
        {next && (
          <button type="button" id="docs-next" onClick={() => onNavigate(next.slug)} className="rounded-xl border p-4 text-right transition-colors hover:border-primary/40 hover:bg-secondary/50">
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Next <ArrowRight className="h-3 w-3" /></span>
            <span className="mt-1 block font-semibold">{next.title}</span>
          </button>
        )}
      </nav>
    </article>
  );
}
