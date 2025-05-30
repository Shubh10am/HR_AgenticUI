
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context'; // Using for consistency, even if register directly calls API
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/icons/logo';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function RegisterPage() {
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false); // Local loading state for register button
  const { toast } = useToast();
  const { register } = useAuth(); // Though register also has its own loading, this is fine.

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!adminEmail.endsWith(`@${orgDomain}`)) {
      toast({ title: 'Invalid Admin Email', description: `Admin email must belong to the organization domain (@${orgDomain}).`, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    await register({ orgName, orgDomain, adminName, adminEmail, password });
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4 text-primary hover:text-primary/90">
            <Logo className="h-10 w-10" />
        </Link>
        <CardTitle className="text-2xl">Create Your HR Streamline AI Account</CardTitle>
        <CardDescription>Register your organization and create an admin account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your Company Inc." required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgDomain">Organization Email Domain</Label>
              <Input id="orgDomain" value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} placeholder="yourcompany.com" required disabled={isSubmitting} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminName">Your Full Name (Admin)</Label>
            <Input id="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="John Doe" required disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Your Email (Admin)</Label>
            <Input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@yourcompany.com" required disabled={isSubmitting} />
             <p className="text-xs text-muted-foreground">Must match organization domain (e.g., if domain is acme.com, email must be user@acme.com)</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********" required disabled={isSubmitting} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Register
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm">
        <p>
          Already have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/login">Log in here</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
