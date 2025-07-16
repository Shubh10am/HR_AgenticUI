
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  PauseCircle,
  LogOut,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

interface AccountStatusOverlayProps {
  status: 'Hold' | 'Suspended';
}

const statusDetails = {
  Hold: {
    icon: PauseCircle,
    title: 'Account On Hold',
    description: "Your organization's account is temporarily on hold.",
    reason:
      'This is often due to a pending verification, a billing issue, or a routine review. Full access to the platform\'s features is currently restricted until the issue is resolved.',
  },
  Suspended: {
    icon: ShieldAlert,
    title: 'Account Suspended',
    description: "Your organization's account has been suspended.",
    reason:
      'This is typically due to a significant issue such as a violation of our terms of service. Access to the platform has been disabled pending a review.',
  },
};

const commonReasons = [
  'Unusual or suspicious account activity.',
  'Security concerns or potential fraud detection.',
  'Violation of platform policies or terms of service.',
  'Payment, billing, or subscription problems.',
  'Regulatory or legal compliance requirements.',
  'Abuse of platform mechanics or features.',
  'High-risk metrics related to platform usage.',
  'Intellectual property infringement claims.',
  'Spam or other abusive content generation.',
  'Excessive resource overuse (API, Hosting, etc.).',
  'Account ownership or information mismatch issues.',
];

export default function AccountStatusOverlay({ status }: AccountStatusOverlayProps) {
  const { logout } = useAuth();
  const details = statusDetails[status];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-auto">
      <Card className="w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
        <CardHeader className="text-center items-center flex-shrink-0">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              status === 'Suspended'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-yellow-500/10 text-yellow-600'
            }`}
          >
            <details.icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{details.title}</CardTitle>
          <CardDescription>{details.description}</CardDescription>
        </CardHeader>

        {/* Scrollable content area */}
        <ScrollArea className="flex-grow min-h-0 overflow-auto">
          <CardContent className="text-sm p-6">
            <p className="text-center text-muted-foreground mb-4">
              {details.reason}
            </p>

            <div className="bg-secondary/50 p-4 rounded-lg my-6 text-left">
              <h4 className="font-semibold mb-2 text-foreground">
                Common Reasons for Account Review:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside space-y-0 text-muted-foreground text-xs">
                {commonReasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            <p className="text-center text-muted-foreground mb-6">
              Please contact your organization's administrator. If you are the
              administrator, please reach out to our support team to resolve
              this issue.
            </p>

            <Separator className="my-4" />

            <div className="space-y-4 text-center">
              <h4 className="font-semibold text-foreground">Contact Support</h4>
              <div className="flex flex-col sm:flex-row justify-around items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@hrstreamline.ai</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <span>urgent@hrstreamline.ai</span>
                </div>
              </div>
            </div>
          </CardContent>
        </ScrollArea>

        {/* Footer actions */}
        <div className="p-6 pt-0 border-t mt-auto flex-shrink-0">
          <div className="flex w-full flex-col sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                (window.location.href = 'mailto:support@hrstreamline.ai')
              }
            >
              <Mail className="mr-2 h-4 w-4" /> Email Support
            </Button>
            <Button onClick={logout} className="flex-1">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
