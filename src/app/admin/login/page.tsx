// This file is no longer used for the primary admin login flow,
// as the SuperAdmin now logs in via the main /login page.
// It can be kept for potential future use or removed.
// For now, I will leave a simple placeholder to avoid breaking any potential links.

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function DeprecatedAdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Admin Login Deprecated</CardTitle>
          <CardDescription>
            The SuperAdmin now logs in through the main application login page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please <Link href="/login" className="text-primary underline">click here</Link> to go to the correct login page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
