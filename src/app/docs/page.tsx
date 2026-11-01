'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { docSections, findDocPage, flatDocPages } from '@/lib/docs';
import type { DocPage, DocSection } from '@/lib/docs/types';
import { cn } from '@/lib/utils';
import DocArticle, { articleOutline } from './components/doc-article';
import DocsHome from './components/docs-home';
import DocsSidebar from './components/docs-sidebar';

function pageText(page: DocPage): string {
  return [
    page.title, page.summary, ...page.overview,
    ...(page.features ?? []).flatMap((f) => [f.title, f.description]),
    ...(page.howTos ?? []).flatMap((h) => [h.title, ...h.steps.flatMap((s) => [s.title, s.body])]),
    ...(page.faqs ?? []).flatMap((f) => [f.question, f.answer]),
  ].join(' ').toLowerCase();
}

function slugFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const slug = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  return findDocPage(slug) ? slug : null;
}

export default function DocsPage() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  // Deep links: /docs#recruitment opens that guide, and back/forward work.
  useEffect(() => {
    const sync = () => setActiveSlug(slugFromHash());
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const navigate = useCallback((slug: string | null) => {
    window.history.pushState(null, '', slug ? `#${slug}` : window.location.pathname);
    setActiveSlug(slug);
    window.scrollTo({ top: 0 });
  }, []);

  const filteredSections: DocSection[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return docSections;
    return docSections
      .map((section) => ({ ...section, pages: section.pages.filter((page) => pageText(page).includes(term)) }))
      .filter((section) => section.pages.length > 0);
  }, [searchTerm]);

  const activePage = activeSlug ? findDocPage(activeSlug) : undefined;
  const activeSection = activePage ? docSections.find((section) => section.pages.includes(activePage)) : undefined;
  const pageIndex = activePage ? flatDocPages.indexOf(activePage) : -1;
  const outline = useMemo(() => (activePage ? articleOutline(activePage) : []), [activePage]);

  // Highlight the outline entry for the section currently in view.
  useEffect(() => {
    if (outline.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHeading(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    outline.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [outline]);

  return (
    <div className="flex gap-8 py-8">
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-64 shrink-0 lg:block">
        <DocsSidebar sections={filteredSections} activeSlug={activeSlug} searchTerm={searchTerm} onSearch={setSearchTerm} onNavigate={navigate} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="relative mb-6 lg:hidden">
          <select
            id="docs-mobile-nav"
            aria-label="Choose a guide"
            value={activeSlug ?? ''}
            onChange={(event) => navigate(event.target.value || null)}
            className="h-11 w-full appearance-none rounded-xl border bg-background px-4 pr-10 text-sm font-medium"
          >
            <option value="">Overview</option>
            {docSections.map((section) => (
              <optgroup key={section.id} label={section.title}>
                {section.pages.map((page) => <option key={page.slug} value={page.slug}>{page.title}</option>)}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {activePage && activeSection ? (
          <DocArticle
            key={activePage.slug}
            page={activePage}
            sectionTitle={activeSection.title}
            previous={flatDocPages[pageIndex - 1]}
            next={flatDocPages[pageIndex + 1]}
            onNavigate={navigate}
          />
        ) : (
          <DocsHome sections={searchTerm ? filteredSections : docSections} onNavigate={navigate} />
        )}
      </div>

      {activePage && (
        <aside className="sticky top-24 hidden h-fit w-56 shrink-0 xl:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
          <ul className="mt-3 space-y-1 border-l">
            {outline.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${activePage.slug}`}
                  onClick={(event) => { event.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); }}
                  className={cn('-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors', activeHeading === item.id ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
