import { aiRecruitment } from './posts/ai-recruitment';
import { hrAnalytics } from './posts/hr-analytics';
import { hrAutomation } from './posts/hr-automation';
import { remoteOnboarding } from './posts/remote-onboarding';
import { taskManagement } from './posts/task-management';
import { unifiedCommunications } from './posts/unified-communications';
import type { BlogPost } from './types';

// Matches public/sitemap.xml and the site's share image: the canonical host is www.
export const SITE_URL = 'https://www.agentic-hr.in';
export const SITE_NAME = 'HR Streamline AI';

/** All posts, newest first. */
export const blogPosts: BlogPost[] = [aiRecruitment, hrAutomation, hrAnalytics, taskManagement, remoteOnboarding, unifiedCommunications];

export function findPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

/** Section headings from `<h2 id="...">`, for the table of contents. */
export function postHeadings(post: BlogPost): { id: string; title: string }[] {
  return Array.from(post.content.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g), (match) => ({ id: match[1], title: match[2] }));
}

export type { BlogPost, BlogFaq } from './types';
