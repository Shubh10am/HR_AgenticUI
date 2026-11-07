'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { isGuestToken } from '@/lib/guest-demo';

/**
 * Calls the app's organisation APIs with the session token. `run` shows a toast on failure
 * and resolves to null, so pages can stay free of try/catch.
 */
export function useOrgApi() {
  const { token, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const isGuest = isGuestToken(token);

  const call = useCallback(
    async <T,>(url: string, method = 'GET', body?: unknown): Promise<T> => {
      if (isGuest) throw new Error('Sign in to use this. You are viewing the app as a guest.');
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Something went wrong.');
      return data as T;
    },
    [isGuest, token]
  );

  const run = useCallback(
    async <T,>(url: string, method = 'GET', body?: unknown, success?: string): Promise<T | null> => {
      try {
        const data = await call<T>(url, method, body);
        if (success) toast({ title: success });
        return data;
      } catch (error) {
        toast({ title: error instanceof Error ? error.message : 'Something went wrong.', variant: 'destructive' });
        return null;
      }
    },
    [call, toast]
  );

  const role = user?.role ?? '';
  return { call, run, isGuest, authLoading, user, role, isPeopleTeam: role === 'Admin' || role === 'HR' || role === 'SuperAdmin' };
}
