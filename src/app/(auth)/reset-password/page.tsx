
'use client';

import { useState, type FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/icons/logo';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'The passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!token) {
      toast({ title: 'Error', description: 'Missing reset token.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 text-primary hover:text-primary/90">
            <Logo className="h-10 w-10" />
        </Link>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          {isSuccess 
            ? 'Your password has been successfully updated.' 
            : 'Enter your new password below.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-destructive">
            <AlertCircle className="h-16 w-16 mb-4" />
            <p className="font-semibold text-lg">An Error Occurred</p>
            <p>{error}</p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="font-semibold text-lg">Password Reset!</p>
            <p className="text-muted-foreground mt-2">You can now log in with your new password.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Reset Password
            </Button>
          </form>
        )}
      </CardContent>
       <CardFooter className="flex-col space-y-2 text-sm">
        {isSuccess || error ? (
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/login">Return to Log in</Link>
            </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
