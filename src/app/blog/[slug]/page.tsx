
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-data';


export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <div className="mb-4">
            <Link href="/blog" className="text-sm text-primary hover:underline">
                &larr; Back to Blog
            </Link>
        </div>
        <Badge variant="outline" className="mb-4 border-primary/50 text-primary">{post.category}</Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">{post.title}</h1>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{post.date}</span>
          </div>
        </div>
      </header>
      
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-lg">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          data-ai-hint={post.dataAiHint}
          priority
        />
      </div>

      <div
        className="prose dark:prose-invert prose-lg max-w-none mx-auto
                   prose-p:text-foreground/80
                   prose-headings:text-foreground prose-headings:font-bold
                   prose-strong:text-foreground
                   prose-a:text-primary hover:prose-a:text-primary/80
                   prose-ul:text-foreground/80
                   prose-ol:text-foreground/80"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
