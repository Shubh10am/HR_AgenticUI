import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Clock } from 'lucide-react';
import { authorInitials, readingMinutes, type BlogPost } from '@/lib/blog-utils';
import { cn } from '@/lib/utils';

function AuthorLine({ post, light }: { post: BlogPost; light?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 text-xs', light ? 'text-white/80' : 'text-muted-foreground')}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', light ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary')}>
        {authorInitials(post.author)}
      </span>
      <span className="min-w-0">
        <span className={cn('block truncate font-medium', light ? 'text-white' : 'text-foreground')}>{post.author}</span>
        <span className="flex items-center gap-1.5">{post.date} · <Clock className="h-3 w-3" /> {readingMinutes(post)} min read</span>
      </span>
    </div>
  );
}

/** Large hero card for the newest post. */
export function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} id={`blog-featured-${post.slug}`} className="group relative block overflow-hidden rounded-3xl shadow-xl shadow-slate-900/10">
      <div className="relative aspect-[4/5] w-full sm:aspect-[21/9]">
        <Image src={post.image} alt={post.title} fill priority sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" data-ai-hint={post.dataAiHint} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/10 sm:via-slate-950/45 sm:to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">Featured</span>
          <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-white">{post.category}</span>
        </div>
        <h2 className="mt-4 max-w-3xl font-display text-2xl font-bold leading-tight text-white sm:text-4xl">{post.title}</h2>
        <p className="mt-3 hidden max-w-2xl text-white/80 sm:block">{post.description}</p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <AuthorLine post={post} light />
          <span className="hidden items-center gap-1 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors group-hover:bg-white group-hover:text-primary sm:inline-flex">
            Read article <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Standard grid card. */
export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} id={`blog-card-${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src={post.image} alt={post.title} fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" data-ai-hint={post.dataAiHint} />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">{post.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug transition-colors group-hover:text-primary">{post.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{post.description}</p>
        <div className="mt-5 border-t pt-4"><AuthorLine post={post} /></div>
      </div>
    </Link>
  );
}
