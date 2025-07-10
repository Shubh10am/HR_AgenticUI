
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const blogPosts = [
  {
    slug: 'optimizing-recruitment-with-ai',
    title: 'Optimizing Recruitment: How AI is Reshaping the Hiring Landscape',
    description: 'Explore how artificial intelligence is streamlining the recruitment process, from resume screening to candidate interviews, saving time and improving hire quality.',
    author: 'Jane Doe',
    date: 'July 28, 2024',
    category: 'Recruitment',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'recruitment technology',
  },
  {
    slug: 'future-of-hr-automation',
    title: 'The Future of HR is Here: Embracing Automation for Better Workplaces',
    description: 'A deep dive into how automation tools are freeing up HR professionals to focus on strategic initiatives and employee engagement.',
    author: 'John Smith',
    date: 'July 25, 2024',
    category: 'HR Tech',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'hr automation',
  },
  {
    slug: 'data-driven-decision-making-in-hr',
    title: 'Data-Driven Decision Making in Human Resources',
    description: 'Learn how to leverage analytics and reporting tools to make informed decisions that boost employee retention and performance.',
    author: 'Alice Johnson',
    date: 'July 22, 2024',
    category: 'Analytics',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'data analytics',
  },
  {
    slug: 'boosting-productivity-with-task-management',
    title: 'Boosting Team Productivity with Integrated Task Management',
    description: 'Discover the best practices for using task management systems to keep your projects on track and your team aligned.',
    author: 'Mike Brown',
    date: 'July 18, 2024',
    category: 'Productivity',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'team productivity',
  },
    {
    slug: 'effective-onboarding-in-a-remote-world',
    title: 'Effective Onboarding in a Remote World',
    description: 'Strategies for creating a welcoming and effective onboarding experience for new remote employees.',
    author: 'Emily White',
    date: 'July 15, 2024',
    category: 'Onboarding',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'remote work onboarding',
  },
  {
    slug: 'the-role-of-unified-communications',
    title: 'The Role of Unified Communications in a Hybrid Workforce',
    description: 'How integrating communication channels can enhance collaboration and connection for hybrid teams.',
    author: 'Chris Green',
    date: 'July 12, 2024',
    category: 'Communication',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'team communication',
  },
];


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
