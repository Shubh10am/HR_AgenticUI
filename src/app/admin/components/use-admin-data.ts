'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

/**
 * Loads JSON from an admin API with the signed-in admin's token.
 * Errors are returned for inline display rather than toasted, so a failing
 * request can't trigger a re-render loop.
 */
export function useAdminData<T>(url: string | null) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!url || !token) return;
    setIsLoading(true);
    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
      setData(body as T);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Request failed.');
    } finally {
      setIsLoading(false);
    }
  }, [url, token]);

  useEffect(() => { load(); }, [load]);

  return { data, error, isLoading, reload: load };
}
