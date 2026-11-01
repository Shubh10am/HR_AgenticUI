import { blogPosts, type BlogPost } from './blog';

export type { BlogPost };

const WORDS_PER_MINUTE = 220;

/** Estimated minutes to read a post, from its HTML content. */
export function readingMinutes(post: BlogPost): number {
  const words = post.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Initials for an author avatar, e.g. "Shubham Singh" → "SS". */
export function authorInitials(name: string): string {
  return name.split(/\s+/).map((part) => part.charAt(0)).join('').slice(0, 2).toUpperCase();
}

/** Up to `limit` other posts, same category first. */
export function relatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const others = blogPosts.filter((candidate) => candidate.slug !== post.slug);
  return [...others.filter((p) => p.category === post.category), ...others.filter((p) => p.category !== post.category)].slice(0, limit);
}

export const blogCategories: string[] = [...new Set(blogPosts.map((post) => post.category))];
