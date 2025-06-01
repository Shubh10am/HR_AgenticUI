
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Lock, Bell, Palette, Plug, ChevronRight, Settings, Volume2, Sun, Moon, Laptop, Type,CaseSensitive } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

const FONT_STYLE_KEY = 'appFontStyle';
const FONT_SIZE_KEY = 'appFontSize';

const FONT_STYLE_CLASSES: Record<string, string> = {
  sans: 'font-style-sans',
  serif: 'font-style-serif',
  mono: 'font-style-mono',
};

const FONT_SIZE_CLASSES: Record<string, string> = {
  small: 'font-size-small',
  default: 'font-size-default',
  large: 'font-size-large',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { theme, setTheme } = useTheme();
  const [selectedFontStyle, setSelectedFontStyle] = useState('sans');
  const [selectedFontSize, setSelectedFontSize] = useState('default');

  const applyFontStyle = useCallback((style: string) => {
    if (typeof window !== 'undefined') {
      Object.values(FONT_STYLE_CLASSES).forEach(cls => document.documentElement.classList.remove(cls));
      const styleClass = FONT_STYLE_CLASSES[style];
      if (styleClass) {
        document.documentElement.classList.add(styleClass);
        localStorage.setItem(FONT_STYLE_KEY, style);
        setSelectedFontStyle(style);
      }
    }
  }, []);

  const applyFontSize = useCallback((size: string) => {
    if (typeof window !== 'undefined') {
      Object.values(FONT_SIZE_CLASSES).forEach(cls => document.documentElement.classList.remove(cls));
      const sizeClass = FONT_SIZE_CLASSES[size];
      if (sizeClass) {
        document.documentElement.classList.add(sizeClass);
        localStorage.setItem(FONT_SIZE_KEY, size);
        setSelectedFontSize(size);
      }
    }
  }, []);

  useEffect(() => {
    const storedSoundPreference = localStorage.getItem('notificationSoundEnabled');
    if (storedSoundPreference !== null) {
      setSoundEnabled(storedSoundPreference === 'true');
    }

    const storedFontStyle = localStorage.getItem(FONT_STYLE_KEY);
    if (storedFontStyle && FONT_STYLE_CLASSES[storedFontStyle]) {
      applyFontStyle(storedFontStyle);
    } else {
      applyFontStyle('sans'); // Default
    }

    const storedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (storedFontSize && FONT_SIZE_CLASSES[storedFontSize]) {
      applyFontSize(storedFontSize);
    } else {
      applyFontSize('default'); // Default
    }
  }, [applyFontStyle, applyFontSize]);

  const handleMockAction = (action: string) => {
    toast({
      title: `${action} (Mock)`,
      description: `This action is for demonstration purposes.`,
    });
  };

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem('notificationSoundEnabled', String(checked));
    toast({
      title: `Notification Sounds ${checked ? 'Enabled' : 'Disabled'}`,
    });
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast({
      title: `Theme Changed`,
      description: `Switched to ${value.charAt(0).toUpperCase() + value.slice(1)} theme.`,
    });
  };

  const handleFontStyleChange = (style: string) => {
    applyFontStyle(style);
    toast({
      title: `Font Style Changed`,
      description: `Switched to ${style.charAt(0).toUpperCase() + style.slice(1)} font.`,
    });
  };

  const handleFontSizeChange = (size: string) => {
    applyFontSize(size);
    toast({
      title: `Font Size Changed`,
      description: `Switched to ${size.charAt(0).toUpperCase() + size.slice(1)} size.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Application Settings"
        description="Configure your application preferences and account details."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5 text-primary" /> Account
            </CardTitle>
            <CardDescription>Manage your account security and details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => handleMockAction('Change Password Clicked')}>
              Change Password
            </Button>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="twoFactor" className="flex flex-col space-y-1">
                <span>Two-Factor Authentication</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Enhance your account security.
                </span>
              </Label>
              <Switch id="twoFactor" disabled checked={false} aria-readonly />
            </div>
             <Button variant="destructive" className="w-full justify-start" onClick={() => handleMockAction('Delete Account Clicked')}>
              Delete Account (Mock)
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>Choose how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="taskNotifications">Email for new tasks</Label>
              <Switch id="taskNotifications" defaultChecked onCheckedChange={(checked) => handleMockAction(`Task Email Notifications ${checked ? 'Enabled' : 'Disabled'}`)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="mentionNotifications">Slack for mentions</Label>
              <Switch id="mentionNotifications" defaultChecked onCheckedChange={(checked) => handleMockAction(`Mention Slack Notifications ${checked ? 'Enabled' : 'Disabled'}`)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="digestEmail">Weekly Digest Email</Label>
              <Switch id="digestEmail" onCheckedChange={(checked) => handleMockAction(`Weekly Digest ${checked ? 'Enabled' : 'Disabled'}`)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="soundNotifications" className="flex flex-col space-y-1">
                <span className="flex items-center"><Volume2 className="mr-2 h-4 w-4" />Enable Notification Sounds</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Play sounds for toast notifications.
                </span>
              </Label>
              <Switch
                id="soundNotifications"
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base">Theme Preference</Label>
              <RadioGroup value={theme} onValueChange={handleThemeChange} className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light" className="flex items-center cursor-pointer flex-1">
                    <Sun className="mr-2 h-4 w-4" /> Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark" className="flex items-center cursor-pointer flex-1">
                    <Moon className="mr-2 h-4 w-4" /> Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system" className="flex items-center cursor-pointer flex-1">
                    <Laptop className="mr-2 h-4 w-4" /> System Default
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Separator />
            <div>
              <Label htmlFor="fontStyleSelect" className="text-base flex items-center mb-1"><Type className="mr-2 h-4 w-4" /> Font Style</Label>
              <Select value={selectedFontStyle} onValueChange={handleFontStyleChange}>
                <SelectTrigger id="fontStyleSelect">
                  <SelectValue placeholder="Select font style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans">Sans-Serif (Default)</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="mono">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <Label htmlFor="fontSizeSelect" className="text-base flex items-center mb-1"><CaseSensitive className="mr-2 h-4 w-4" /> Font Size</Label>
              <Select value={selectedFontSize} onValueChange={handleFontSizeChange}>
                <SelectTrigger id="fontSizeSelect">
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plug className="mr-2 h-5 w-5 text-primary" /> Integrations
            </CardTitle>
            <CardDescription>Manage your connected services and third-party applications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/integrations">
                Go to Integrations Page
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
