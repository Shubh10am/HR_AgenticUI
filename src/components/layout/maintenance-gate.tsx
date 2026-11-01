'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Wrench } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface PlatformStatus {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportEmail: string;
}

const RECHECK_MS = 60_000;

/**
 * Replaces the app with a maintenance notice while the platform is in
 * maintenance. The API enforces the lock; this only explains it to the user.
 */
export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const isPlatformAdmin = user?.organizationId === null && (user?.role === 'SuperAdmin' || user?.role === 'Admin');

  useEffect(() => {
    let cancelled = false;
    const check = () => fetch('/api/platform/status').then((response) => response.json()).then((body) => { if (!cancelled) setStatus(body); }).catch(() => {});
    check();
    const timer = setInterval(check, RECHECK_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  if (!status?.maintenanceMode || isPlatformAdmin) return <>{children}</>;

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600"><Wrench className="h-7 w-7" /></span>
        <h1 className="mt-5 font-display text-2xl font-bold">Down for maintenance</h1>
        <p className="mt-2 text-muted-foreground">{status.maintenanceMessage}</p>
        {status.supportEmail && <p className="mt-4 text-sm text-muted-foreground">Questions? <a className="text-primary hover:underline" href={`mailto:${status.supportEmail}`}>{status.supportEmail}</a></p>}
      </div>
    </div>
  );
}
