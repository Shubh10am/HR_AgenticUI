import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/blog';

/** /robots.txt: index public pages; keep the app, admin and API out of search. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/onboarding/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
