
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/icons/logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      setIsSubmitted(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>
            {isSubmitted 
              ? "Check your inbox for a password reset link."
              : "Enter your email and we'll send you a link to reset your password."
            }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4"/>
                <p className="font-semibold text-lg">Email Sent!</p>
                <p className="text-muted-foreground mt-2">
                    A password reset link has been sent to <strong>{email}</strong>. Please check your inbox and spam folder.
                </p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                id="email"
                type="email"
                placeholder="you@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send Reset Link
            </Button>
            </form>
        )}
      </CardContent>
      <CardFooter className="flex-col space-y-2 text-sm">
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log in
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
