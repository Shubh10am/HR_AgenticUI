
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// In a real app, you'd fetch this data from a CMS
const blogPosts = [
  {
    slug: 'optimizing-recruitment-with-ai',
    title: 'Optimizing Recruitment: How AI is Reshaping the Hiring Landscape',
    description: 'Explore how artificial intelligence is streamlining the recruitment process, from resume screening to candidate interviews, saving time and improving hire quality.',
    author: 'Jane Doe',
    date: 'July 28, 2024',
    category: 'Recruitment',
    image: 'https://placehold.co/1200x600.png',
    dataAiHint: 'recruitment technology office',
    content: `
      <p>The world of recruitment is undergoing a seismic shift. Traditional methods, often bogged down by manual processes and human bias, are giving way to a more efficient, data-driven approach powered by Artificial Intelligence. At HR Streamline AI, we're at the forefront of this revolution, building tools that empower HR professionals to find the best talent faster.</p>
      
      <h3 class="text-2xl font-bold mt-8 mb-4">The Challenge with Traditional Hiring</h3>
      <p>For decades, hiring has been a labor-intensive process. Recruiters spend countless hours sifting through resumes, scheduling interviews, and managing candidate communication. This not only slows down the hiring pipeline but also introduces unconscious biases that can lead to less diverse and potentially less qualified teams.</p>
      
      <h3 class="text-2xl font-bold mt-8 mb-4">How AI is Changing the Game</h3>
      <p>Our platform leverages AI to tackle these challenges head-on:</p>
      <ul class="list-disc list-inside space-y-2 my-4">
        <li><strong>AI-Powered Resume Screening:</strong> Instead of manually reading hundreds of resumes, our AI analyzes and scores candidates based on criteria you define, surfacing the most qualified applicants in seconds. It looks for skills, experience, and qualifications, not names or backgrounds.</li>
        <li><strong>Automated Candidate Engagement:</strong> From initial outreach to scheduling interviews, our system can handle routine communication, freeing up recruiters to focus on building relationships with top candidates.</li>
        <li><strong>AI-Assisted Interviews:</strong> Our AI Interviewer can conduct initial screening rounds, asking consistent, role-relevant questions to every candidate. This provides objective, unbiased data points, helping you compare apples to apples.</li>
        <li><strong>Data-Driven Insights:</strong> By analyzing the entire recruitment funnel, HR Streamline AI provides insights into what's working and what's not, helping you refine your strategy for future hires.</li>
      </ul>
      
      <h3 class="text-2xl font-bold mt-8 mb-4">The Result: A Smarter, Faster, Fairer Process</h3>
      <p>By integrating AI into your recruitment workflow, you don't just speed up hiring. You make it smarter and fairer. The result is a stronger, more diverse team and a significant return on investment as your time-to-hire shrinks and your quality-of-hire improves. Ready to see the future of recruitment? <a href="/recruitment" class="text-primary hover:underline">Explore our recruitment tools today</a>.</p>
    `
  },
  {
    slug: 'future-of-hr-automation',
    title: 'The Future of HR is Here: Embracing Automation for Better Workplaces',
    author: 'John Smith',
    date: 'July 25, 2024',
    category: 'HR Tech',
    image: 'https://placehold.co/1200x600.png',
    dataAiHint: 'futuristic office hr',
    content: `<p>Content for "The Future of HR is Here" goes here. This is a placeholder.</p>`
  },
  {
    slug: 'data-driven-decision-making-in-hr',
    title: 'Data-Driven Decision Making in Human Resources',
    author: 'Alice Johnson',
    date: 'July 22, 2024',
    category: 'Analytics',
    image: 'https://placehold.co/1200x600.png',
    dataAiHint: 'charts graphs analytics',
    content: `<p>Content for "Data-Driven Decision Making" goes here. This is a placeholder.</p>`
  },
  {
    slug: 'boosting-productivity-with-task-management',
    title: 'Boosting Team Productivity with Integrated Task Management',
    author: 'Mike Brown',
    date: 'July 18, 2024',
    category: 'Productivity',
    image: 'https://placehold.co/1200x600.png',
    dataAiHint: 'team working taskboard',
    content: `<p>Content for "Boosting Team Productivity" goes here. This is a placeholder.</p>`
  },
    {
    slug: 'effective-onboarding-in-a-remote-world',
    title: 'Effective Onboarding in a Remote World',
    author: 'Emily White',
    date: 'July 15, 2024',
    category: 'Onboarding',
    image: 'https://placehold.co/1200x600.png',
    dataAiHint: 'remote onboarding video call',
    content: `<p>Content for "Effective Onboarding" goes here. This is a placeholder.</p>`
  },
  {
    slug: 'the-role-of-unified-communications',
    title: 'The Role of Unified Communications in a Hybrid Workforce',
    author: 'Chris Green',
    date: 'July 12, 2024',
    category: 'Communication',
    image: 'https://placehold.co/1200x600.png',
    dataAiHint: 'communication icons network',
    content: `<p>Content for "Unified Communications" goes here. This is a placeholder.</p>`
  },
];


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
        <div className="flex items-center justify-center gap-6 text-sm text-neutral-400">
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
      
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-12">
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
        className="prose prose-invert prose-lg max-w-none mx-auto
                   prose-p:text-neutral-300
                   prose-headings:text-white prose-headings:font-bold
                   prose-strong:text-white
                   prose-a:text-primary hover:prose-a:text-primary/80
                   prose-ul:text-neutral-300
                   prose-ol:text-neutral-300"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
