
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MagicLoginPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth(); // We'll use the main auth context to set the user state

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setErrorMessage('Magic link token is missing.');
      setStatus('error');
      return;
    }

    const performMagicLogin = async () => {
      try {
        const response = await fetch('/api/auth/magic-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process magic link.');
        }

        // Manually set auth state from response data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        
        toast({ title: 'Magic Login Successful', description: 'Welcome!' });
        setStatus('success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);

      } catch (error: any) {
        setErrorMessage(error.message);
        setStatus('error');
      }
    };

    performMagicLogin();
  }, [searchParams, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Magic Link Login</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your magic link...'}
            {status === 'success' && 'Login successful! Redirecting...'}
            {status === 'error' && 'Login Failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Please wait.</p>
            </div>
          )}
          {status === 'success' && (
             <div className="flex flex-col items-center justify-center p-8">
              <p>You will be redirected to your dashboard shortly.</p>
            </div>
          )}
           {status === 'error' && (
             <div className="flex flex-col items-center justify-center p-8 text-destructive">
              <p>{errorMessage}</p>
              <Link href="/login" className="mt-4 text-primary underline">
                Return to Login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
