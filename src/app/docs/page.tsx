
'use client';

import { useState, useEffect, useMemo } from 'react';
import { docsData, type DocPage, type DocSection } from '@/lib/docs-data';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DocsPage() {
  const [activePage, setActivePage] = useState<DocPage | null>(docsData[0]?.pages[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  const filteredDocsData = useMemo(() => {
    if (!searchTerm) return docsData;
    const lowercasedTerm = searchTerm.toLowerCase();

    const filtered = docsData.map(section => {
      const filteredPages = section.pages.filter(page =>
        page.title.toLowerCase().includes(lowercasedTerm) ||
        page.content.toLowerCase().includes(lowercasedTerm)
      );
      return { ...section, pages: filteredPages };
    }).filter(section => section.pages.length > 0);
    
    return filtered;
  }, [searchTerm]);

  const headings = useMemo(() => {
    if (!activePage) return [];
    const matches = activePage.content.matchAll(/<h3 id="([^"]+)">([^<]+)<\/h3>/g);
    return Array.from(matches, match => ({ id: match[1], title: match[2] }));
  }, [activePage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let currentBest: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!currentBest || entry.intersectionRatio > currentBest.intersectionRatio) {
              currentBest = entry;
            }
          }
        }
        if (currentBest) {
          setActiveHeading(currentBest.target.id);
        }
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0.1 }
    );

    const elements = headings.map(h => document.getElementById(h.id)).filter(Boolean);
    elements.forEach(el => el && observer.observe(el));

    return () => {
      elements.forEach(el => el && observer.unobserve(el));
    };
  }, [headings]);

  const handlePageSelect = (page: DocPage) => {
    setActivePage(page);
    // Reset scroll position to top of content area on page change
    const contentArea = document.getElementById('docs-content-area');
    if(contentArea) contentArea.scrollTo(0, 0);
  }

  const defaultAccordionValue = docsData.length > 0 ? [docsData[0].id] : [];

  return (
    <div className="flex">
      {/* Left Sidebar */}
      <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] w-64 xl:w-72 flex-shrink-0 border-r py-8 pr-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search docs..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <nav className="mt-6">
          <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full">
            {filteredDocsData.map(section => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-base font-semibold hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2 border-l border-border ml-2">
                    {section.pages.map(page => (
                      <li key={page.slug}>
                        <button
                          onClick={() => handlePageSelect(page)}
                          className={cn(
                            "block w-full text-left pl-4 py-1.5 text-sm rounded-r-md border-l-2",
                            activePage?.slug === page.slug
                              ? "text-primary border-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:border-muted-foreground border-transparent"
                          )}
                        >
                          {page.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
      </aside>

      {/* Main Content */}
      <main id="docs-content-area" className="flex-1 py-8 lg:py-12 px-4 lg:px-12">
        {activePage ? (
          <article className="prose dark:prose-invert max-w-none">
            <div className="mb-4 text-sm text-muted-foreground">
              Docs &gt; {docsData.find(s => s.pages.some(p => p.slug === activePage.slug))?.title} &gt; {activePage.title}
            </div>
            <h1>{activePage.title}</h1>
            <p className="lead">{activePage.description}</p>
             <div
              className="prose-p:text-foreground/80
                         prose-headings:text-foreground prose-headings:font-bold
                         prose-strong:text-foreground
                         prose-a:text-primary hover:prose-a:text-primary/80
                         prose-ul:text-foreground/80
                         prose-ol:text-foreground/80"
              dangerouslySetInnerHTML={{ __html: activePage.content }}
            />
          </article>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">
              {searchTerm ? 'No results found' : 'Welcome to the Documentation'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {searchTerm ? `Your search for "${searchTerm}" did not match any documents.` : 'Select a topic from the left to get started.'}
            </p>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="hidden xl:block sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 py-8 pl-8">
        {headings.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">On this page</h4>
            <ul className="space-y-2">
              {headings.map(heading => (
                <li key={heading.id}>
                  <Link
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={cn(
                      "block text-sm border-l-2 pl-3",
                      activeHeading === heading.id
                        ? "text-primary border-primary"
                        : "text-muted-foreground hover:text-foreground border-transparent hover:border-muted-foreground"
                    )}
                  >
                    {heading.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
