'use client';

import { useMemo, useState } from 'react';
import { Newspaper, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { blogPosts } from '@/lib/blog-data';
import { blogCategories } from '@/lib/blog-utils';
import { cn } from '@/lib/utils';
import { FeaturedPostCard, PostCard } from './post-card';
import BlogCta from './blog-cta';

const ALL = 'All';

/** Interactive blog listing: search, category filter, featured post and grid. */
export default function BlogIndex() {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return blogPosts.filter((post) =>
      (category === ALL || post.category === category) &&
      (!term || `${post.title} ${post.description} ${post.author} ${post.category}`.toLowerCase().includes(term))
    );
  }, [category, query]);

  const isFiltering = category !== ALL || query.trim() !== '';
  const [featured, ...rest] = filtered;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Newspaper className="h-4 w-4" /> The HR Streamline blog
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          Ideas for <span className="text-gradient-brand">smarter HR</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Practical guides on AI in recruitment, automation, onboarding and building better workplaces.</p>

        <div className="relative mx-auto mt-8 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="blog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" className="h-12 rounded-full bg-card pl-11 pr-10 shadow-sm" />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          )}
        </div>
      </header>

      <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Categories">
        {[ALL, ...blogCategories].map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={category === name}
            id={`blog-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setCategory(name)}
            className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors', category === name ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30' : 'bg-card text-foreground/75 hover:border-primary/40 hover:text-primary')}
          >
            {name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed p-12 text-center">
          <p className="font-semibold">No articles found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another search or category.</p>
        </div>
      ) : (
        <>
          {!isFiltering && featured && <div className="mt-12"><FeaturedPostCard post={featured} /></div>}
          <section className="mt-12">
            <h2 className="sr-only">Articles</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(isFiltering ? filtered : rest).map((post) => <PostCard key={post.slug} post={post} />)}
            </div>
          </section>
        </>
      )}

      <div className="mt-20"><BlogCta /></div>
    </div>
  );
}
