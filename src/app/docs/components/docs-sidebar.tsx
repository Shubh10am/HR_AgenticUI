'use client';

import { Home, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { DocSection } from '@/lib/docs/types';
import { cn } from '@/lib/utils';

interface DocsSidebarProps {
  sections: DocSection[];
  activeSlug: string | null;
  searchTerm: string;
  onSearch: (term: string) => void;
  onNavigate: (slug: string | null) => void;
}

/** Left navigation: search plus every guide grouped by section. */
export default function DocsSidebar({ sections, activeSlug, searchTerm, onSearch, onNavigate }: DocsSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="docs-search" placeholder="Search docs…" className="h-10 rounded-xl pl-9 pr-8" value={searchTerm} onChange={(event) => onSearch(event.target.value)} />
        {searchTerm && (
          <button type="button" aria-label="Clear search" onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        )}
      </div>

      <nav className="mt-5 min-h-0 flex-1 space-y-6 overflow-y-auto pb-8 pr-1" aria-label="Documentation">
        <button
          type="button"
          id="docs-nav-home"
          onClick={() => onNavigate(null)}
          className={cn('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', activeSlug === null ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-secondary')}
        >
          <Home className="h-4 w-4" /> Overview
        </button>
        {sections.map((section) => (
          <div key={section.id}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{section.title}</p>
            <ul className="mt-2 space-y-0.5">
              {section.pages.map((page) => {
                const Icon = page.icon;
                const isActive = page.slug === activeSlug;
                return (
                  <li key={page.slug}>
                    <button
                      type="button"
                      id={`docs-nav-${page.slug}`}
                      onClick={() => onNavigate(page.slug)}
                      className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors', isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground/75 hover:bg-secondary hover:text-foreground')}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{page.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {sections.length === 0 && <p className="px-3 text-sm text-muted-foreground">No guides match “{searchTerm}”.</p>}
      </nav>
    </div>
  );
}
