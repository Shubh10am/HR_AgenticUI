
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Edit3, Activity, Settings2, Bell, Palette, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [clientUser, setClientUser] = useState(user);

  // Ensure user data is updated on client after hydration
  useEffect(() => {
    if (user) {
      setClientUser(user);
    }
  }, [user]);


  const handleEditProfile = () => {
    toast({
      title: 'Edit Profile Clicked',
      description: 'This would open a modal or navigate to an edit profile form (mock).',
    });
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
            <Button variant="outline" size="sm" className="mt-4" onClick={handleEditProfile}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Mock)
            </Button>
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
                <CustomLabel htmlFor="emailNotifications" className="flex items-center">
                  <Bell className="mr-2 h-4 w-4" /> Email Notifications
                </CustomLabel>
                <span className="text-sm text-muted-foreground">Enabled</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <CustomLabel htmlFor="defaultTheme" className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" /> Default Theme
                </CustomLabel>
                <span className="text-sm text-muted-foreground">Dark</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// Renamed Label to CustomLabel to avoid conflict with ShadCN Label if this file were to import it.
const CustomLabel = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label {...props}>{children}</label>
);
