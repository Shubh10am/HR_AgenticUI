
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Edit3, Activity, Settings2, Bell, Palette, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, token, isLoading: authLoading, checkAuth } = useAuth();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  // Keep a client-side version of the user to avoid hydration issues
  // and to ensure the UI updates when the context does.
  const [clientUser, setClientUser] = useState(user);
  useEffect(() => {
    if (user) {
      setClientUser(user);
      setEditName(user.name); // Sync edit name when user context changes
    }
  }, [user]);

  const handleEditProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      // Update local storage and refresh auth context
      localStorage.setItem('authUser', JSON.stringify(data.user));
      checkAuth();

      toast({
        title: 'Profile Updated',
        description: 'Your name has been successfully updated.',
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !clientUser) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="User Profile"
        description="Manage your personal information and preferences."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage 
                src={`https://placehold.co/100x100.png?text=${clientUser.name?.charAt(0).toUpperCase()}`} 
                alt={clientUser.name || "User avatar"} 
                data-ai-hint="user avatar" 
              />
              <AvatarFallback>
                {clientUser.name ? clientUser.name.charAt(0).toUpperCase() : <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{clientUser.name}</CardTitle>
            <CardDescription>{clientUser.email}</CardDescription>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4">
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Your Profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="edit-profile-form" onSubmit={handleEditProfileSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" disabled={isSubmitting}/>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" value={clientUser.email} className="col-span-3" disabled />
                            </div>
                        </div>
                    </form>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" form="edit-profile-form" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="space-y-2">
              <p><strong>Role:</strong> {clientUser.role}</p>
              <p><strong>Organization ID:</strong> {clientUser.organizationId.substring(0,8)}...</p>
              <p><strong>Joined:</strong> January 1, 2024 (Mock)</p>
              <p><strong>Last Login:</strong> {new Date().toLocaleDateString()} (Mock)</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" /> Recent Activity (Mock)
              </CardTitle>
              <CardDescription>A brief overview of your recent actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li>Logged in from new device (IP: 192.168.1.100) - 2 hours ago</li>
                <li>Updated 3 tasks in Project Nova - Yesterday</li>
                <li>Generated 5 email drafts - Yesterday</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings2 className="mr-2 h-5 w-5 text-primary" /> Preferences (Mock)
              </CardTitle>
              <CardDescription>Your personalized settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" /> Email Notifications
                </Label>
                <span className="text-sm text-muted-foreground">Enabled</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="defaultTheme" className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" /> Default Theme
                </Label>
                <span className="text-sm text-muted-foreground">System</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
