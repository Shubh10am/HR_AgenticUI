import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, blogPosts } from '@/lib/blog';
import BlogIndex from './components/blog-index';

const title = `HR Blog: AI, Recruitment & HR Automation Guides | ${SITE_NAME}`;
const description = 'Practical guides on AI in recruitment, HR automation, people analytics, remote onboarding and hybrid communication from the HR Streamline AI team.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { type: 'website', url: `${SITE_URL}/blog`, title, description, siteName: SITE_NAME, images: [{ url: `${SITE_URL}${blogPosts[0].image}` }] },
  twitter: { card: 'summary_large_image', title, description },
};

export default function BlogPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    url: `${SITE_URL}/blog`,
    description,
    blogPost: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      author: { '@type': 'Person', name: post.author },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <BlogIndex />
    </>
  );
}
