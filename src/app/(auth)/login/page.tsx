
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/icons/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({ email, password });
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="space-y-1 text-center">
         <Link href="/" className="flex items-center justify-center gap-2 mb-4 text-primary hover:text-primary/90">
            <Logo className="h-10 w-10" />
        </Link>
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>Enter your credentials to access HR Streamline AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Log In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col space-y-2 text-sm">
        <p>
          Don&apos;t have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/register">Register here</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
