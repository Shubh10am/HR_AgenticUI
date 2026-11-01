import type { MetadataRoute } from 'next';
import { SITE_URL, blogPosts } from '@/lib/blog';

// Public pages only. App pages (recruitment, tasks…) need a sign-in and
// redirect crawlers to /login, so listing them would only waste crawl budget.
const PUBLIC_PAGES: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/docs', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/book-a-demo', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/register', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/login', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/security', priority: 0.2, changeFrequency: 'yearly' },
];

/** /sitemap.xml — generated, so new blog posts and their update dates appear automatically. */
export default function sitemap(): MetadataRoute.Sitemap {
  const latestPost = blogPosts.map((post) => post.dateModified).sort().at(-1);
  return [
    ...PUBLIC_PAGES.map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: path === '/blog' ? latestPost : undefined,
      changeFrequency,
      priority,
    })),
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.dateModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
