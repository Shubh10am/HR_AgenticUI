
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { blogPosts } from '@/lib/blog-data';


export default function BlogPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4">The HR Streamline AI Blog</h1>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto">Insights, tips, and updates on the future of HR technology and workplace productivity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:border-primary/50">
              <div className="relative">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  data-ai-hint={post.dataAiHint}
                />
                 <div className="absolute top-0 left-0 w-full h-full bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <Badge variant="outline" className="mb-2 self-start border-primary/50 text-primary">{post.category}</Badge>
                <h2 className="text-xl font-bold mb-3 flex-grow">{post.title}</h2>
                <p className="text-neutral-400 text-sm mb-4 flex-grow">{post.description}</p>
                <div className="text-xs text-neutral-500 flex items-center justify-between mt-auto pt-4 border-t border-neutral-800">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
