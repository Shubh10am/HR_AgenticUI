import Link from 'next/link';
import { Eye } from 'lucide-react';

/** Tells a guest the page is showing sample data, and how to see their own. */
export default function GuestSampleNotice({ what = 'this page' }: { what?: string }) {
  return (
    <div id="guest-sample-notice" className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
      <Eye className="h-4 w-4 text-primary" />
      <span>You&apos;re viewing <strong>sample data</strong> on {what}.</span>
      <span className="text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link> or{' '}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">register</Link> to see your own.
      </span>
    </div>
  );
}
