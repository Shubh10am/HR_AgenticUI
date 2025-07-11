
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, PauseCircle, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface AccountStatusOverlayProps {
  status: 'Hold' | 'Suspended';
}

const statusDetails = {
  Hold: {
    icon: PauseCircle,
    title: 'Account On Hold',
    description: "Your organization's account is temporarily on hold.",
    reason: "This may be due to a pending verification or a billing issue. Full access to the platform's features is currently restricted.",
  },
  Suspended: {
    icon: ShieldAlert,
    title: 'Account Suspended',
    description: "Your organization's account has been suspended.",
    reason: "This is typically due to a violation of our terms of service or a critical issue. Access to the platform has been disabled.",
  },
};

export default function AccountStatusOverlay({ status }: AccountStatusOverlayProps) {
  const { logout } = useAuth();
  const details = statusDetails[status];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in">
        <CardHeader className="text-center items-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${status === 'Suspended' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-600'}`}>
            <details.icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{details.title}</CardTitle>
          <CardDescription>{details.description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            {details.reason} Please contact your organization's administrator for more information or to resolve this issue.
          </p>
          <div className="flex w-full flex-col sm:flex-row gap-2">
             <Button variant="outline" className="flex-1" onClick={() => window.location.href = 'mailto:support@hrstreamline.ai'}>
              <Mail className="mr-2 h-4 w-4" /> Contact Support
            </Button>
            <Button onClick={logout} className="flex-1">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
