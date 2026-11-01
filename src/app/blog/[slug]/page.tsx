import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Clock, ListOrdered } from 'lucide-react';
import { SITE_NAME, SITE_URL, blogPosts, findPost, postHeadings } from '@/lib/blog';
import { authorInitials, readingMinutes, relatedPosts } from '@/lib/blog-utils';
import { PostCard } from '../components/post-card';
import BlogCta from '../components/blog-cta';
import { ReadingProgress, ShareButtons } from '../components/post-client';

type PageProps = { params: Promise<{ slug: string }> };

/** Pre-render every post at build time. */
export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

/** Per-post title, description, canonical URL and social preview. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: 'Article not found' };
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = `${SITE_URL}${post.image}`;
  return {
    title: `${post.seoTitle} | ${SITE_NAME}`,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.seoTitle,
      description: post.description,
      siteName: SITE_NAME,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [post.author],
      section: post.category,
      tags: post.keywords,
      images: [{ url: image, alt: post.imageAlt }],
    },
    twitter: { card: 'summary_large_image', title: post.seoTitle, description: post.description, images: [image] },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const headings = postHeadings(post);
  const related = relatedPosts(post);

  // Article + FAQ + breadcrumb structured data, for rich results in search.
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: `${SITE_URL}${post.image}`,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      author: { '@type': 'Person', name: post.author, jobTitle: post.authorRole },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      keywords: post.keywords.join(', '),
      articleSection: post.category,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <ReadingProgress />

      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/blog" id="blog-back" className="inline-flex items-center gap-1.5 font-medium hover:text-primary"><ArrowLeft className="h-4 w-4" /> Blog</Link>
          <span>/</span>
          <span className="truncate">{post.category}</span>
        </nav>

        <header className="mt-8">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{post.category}</span>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">{authorInitials(post.author)}</span>
              <div className="text-sm">
                <p className="font-semibold">{post.author} <span className="font-normal text-muted-foreground">· {post.authorRole}</span></p>
                <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                  <time dateTime={post.datePublished}>{post.date}</time> · <Clock className="h-3.5 w-3.5" /> {readingMinutes(post)} min read
                  {post.dateModified !== post.datePublished && <> · Updated <time dateTime={post.dateModified}>{new Date(post.dateModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</time></>}
                </p>
              </div>
            </div>
            <ShareButtons title={post.title} idPrefix="blog-share-top" />
          </div>
        </header>

        <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-3xl shadow-xl shadow-slate-900/10">
          <Image src={post.image} alt={post.imageAlt} fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" data-ai-hint={post.dataAiHint} />
        </div>

        {headings.length > 2 && (
          <nav id="blog-toc" aria-labelledby="blog-toc-title" className="mt-10 rounded-2xl border bg-card p-5">
            <p id="blog-toc-title" className="flex items-center gap-2 text-sm font-semibold"><ListOrdered className="h-4 w-4 text-primary" /> In this article</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {headings.map((heading, index) => (
                <li key={heading.id}>
                  <a href={`#${heading.id}`} className="flex gap-2 text-muted-foreground hover:text-primary">
                    <span className="tabular-nums text-primary/70">{String(index + 1).padStart(2, '0')}</span>{heading.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="blog-content mt-10" dangerouslySetInnerHTML={{ __html: post.content }} />

        {post.faqs.length > 0 && (
          <section id="faq" aria-labelledby="blog-faq-title" className="mt-14">
            <h2 id="blog-faq-title" className="font-display text-2xl font-bold tracking-tight">Frequently asked questions</h2>
            <div className="mt-5 divide-y rounded-2xl border bg-card">
              {post.faqs.map((faq) => (
                <details key={faq.question} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {faq.question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
          <p className="text-sm font-medium">Found this useful? Share it with your team.</p>
          <ShareButtons title={post.title} idPrefix="blog-share-bottom" />
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl" aria-labelledby="blog-related-title">
          <h2 id="blog-related-title" className="font-display text-2xl font-bold tracking-tight">Keep reading</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <PostCard key={item.slug} post={item} />)}
          </div>
        </section>
      )}

      <div className="mx-auto mt-20 max-w-6xl"><BlogCta /></div>
    </>
  );
}
