'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { isGuestToken } from '@/lib/guest-demo';
import { demoFeed, demoHighlights } from '@/lib/community-demo';
import type { CommunityHighlights, FeedPerson, FeedPost, NewPostInput } from '@/lib/community';

const GUEST_MESSAGE = 'Sign in to take part. This is sample data.';

/** Loads the feed and sidebar, and wraps every community action so cards update in place. */
export function useCommunity() {
  const { token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const isGuest = isGuestToken(token);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [highlights, setHighlights] = useState<CommunityHighlights | null>(null);
  const [people, setPeople] = useState<FeedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(url, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Something went wrong.');
      return body as T;
    },
    [token]
  );

  const loadHighlights = useCallback(async () => {
    if (isGuest) return setHighlights(demoHighlights());
    try {
      setHighlights(await call<CommunityHighlights>('/api/community/highlights'));
    } catch {
      setHighlights(null);
    }
  }, [call, isGuest]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (isGuest) {
      setPosts(demoFeed());
      setHighlights(demoHighlights());
      setIsLoading(false);
      return;
    }
    try {
      const [feed, org] = await Promise.all([
        call<FeedPost[]>('/api/community/posts'),
        call<{ people: (FeedPerson & { email: string })[] }>('/api/hierarchy').catch(() => ({ people: [] })),
      ]);
      setPosts(feed);
      setPeople(org.people.map(({ id, name, department }) => ({ id, name, department })));
      void loadHighlights();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the community.');
    } finally {
      setIsLoading(false);
    }
  }, [call, isGuest, loadHighlights]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [load, authLoading]);

  const replace = (next: FeedPost) => setPosts((current) => current.map((post) => (post.id === next.id ? next : post)));

  /** Runs a change against one post; returns true on success. */
  const mutate = async (postId: string, path: string, init: { method: string; body?: unknown }, refreshSidebar = false) => {
    if (isGuest) {
      toast({ title: GUEST_MESSAGE });
      return false;
    }
    try {
      const next = await call<FeedPost>(`/api/community/posts/${postId}${path}`, {
        method: init.method,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      replace(next);
      if (refreshSidebar) void loadHighlights();
      return true;
    } catch (e) {
      toast({ title: 'Could not update the post', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
      return false;
    }
  };

  return {
    isGuest,
    posts,
    highlights,
    people,
    isLoading,
    error,
    reload: load,
    async publish(input: NewPostInput) {
      if (isGuest) {
        toast({ title: GUEST_MESSAGE });
        return false;
      }
      try {
        const post = await call<FeedPost>('/api/community/posts', { method: 'POST', body: JSON.stringify(input) });
        setPosts((current) => [...current.filter((item) => item.pinned), post, ...current.filter((item) => !item.pinned)]);
        void loadHighlights();
        toast({ title: input.anonymous ? 'Posted anonymously' : 'Posted to the community' });
        return true;
      } catch (e) {
        toast({ title: 'Could not post', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
        return false;
      }
    },
    react: (postId: string, emoji: string) => mutate(postId, '/react', { method: 'POST', body: { emoji } }),
    vote: (postId: string, optionId: string) => mutate(postId, '/vote', { method: 'POST', body: { optionId } }),
    rsvp: (postId: string) => mutate(postId, '/rsvp', { method: 'POST' }, true),
    save: (postId: string) => mutate(postId, '/save', { method: 'POST' }),
    pin: (postId: string, pinned: boolean) => mutate(postId, '', { method: 'PATCH', body: { pinned } }),
    comment: (postId: string, content: string, parentId?: string) => mutate(postId, '/comment', { method: 'POST', body: { content, parentId } }),
    editComment: (postId: string, commentId: string, content: string) => mutate(postId, `/comment/${commentId}`, { method: 'PUT', body: { content } }),
    deleteComment: (postId: string, commentId: string) => mutate(postId, `/comment/${commentId}`, { method: 'DELETE' }),
    async remove(postId: string) {
      if (isGuest) return void toast({ title: GUEST_MESSAGE });
      try {
        await call(`/api/community/posts/${postId}`, { method: 'DELETE' });
        setPosts((current) => current.filter((post) => post.id !== postId));
        void loadHighlights();
        toast({ title: 'Post deleted' });
      } catch (e) {
        toast({ title: 'Could not delete the post', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
      }
    },
    async shareBirthday(value: { month: number; day: number } | null) {
      if (isGuest) {
        toast({ title: GUEST_MESSAGE });
        return false;
      }
      try {
        await call('/api/community/birthday', { method: 'PUT', body: JSON.stringify(value ?? {}) });
        await loadHighlights();
        toast({ title: value ? 'Birthday shared with colleagues' : 'Birthday hidden' });
        return true;
      } catch (e) {
        toast({ title: 'Could not save', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
        return false;
      }
    },
  };
}

export type Community = ReturnType<typeof useCommunity>;
