
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Bell, Palette, Plug, ChevronRight, KeyRound, Eye, EyeOff, Copy, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context'; // Added useAuth

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function SettingsPage() {
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { theme, setTheme } = useTheme();
  const [selectedFontStyle, setSelectedFontStyle] = useState('sans');
  const [selectedFontSize, setSelectedFontSize] = useState('default');
  
  const { token } = useAuth(); // Get token for API calls

  const [dbApiKey, setDbApiKey] = useState<string | null>(null); // To store the key fetched from DB
  const [inputApiKey, setInputApiKey] = useState(''); // For the input field
  const [showApiKey, setShowApiKey] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [isKeySaving, setIsKeySaving] = useState(false);

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
  
  const fetchApiKey = useCallback(async () => {
    if (!token) return;
    setIsKeyLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/api-key`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDbApiKey(data.apiKey || null);
        setInputApiKey(data.apiKey || ''); // Populate input if key exists
      } else {
        toast({ title: 'Failed to fetch API key', description: data.error || 'Could not retrieve API key.', variant: 'destructive' });
        setDbApiKey(null);
        setInputApiKey('');
      }
    } catch (error) {
      toast({ title: 'Error fetching API key', description: 'An unexpected error occurred.', variant: 'destructive' });
      setDbApiKey(null);
      setInputApiKey('');
    } finally {
      setIsKeyLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    const storedSoundPreference = localStorage.getItem('notificationSoundEnabled');
    if (storedSoundPreference !== null) {
      setSoundEnabled(storedSoundPreference === 'true');
    }
  }, []);

  useEffect(() => {
    const storedFontStyle = localStorage.getItem(FONT_STYLE_KEY);
    if (storedFontStyle && FONT_STYLE_CLASSES[storedFontStyle]) {
      applyFontStyle(storedFontStyle);
    } else {
      applyFontStyle('sans'); 
    }

    const storedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (storedFontSize && FONT_SIZE_CLASSES[storedFontSize]) {
      applyFontSize(storedFontSize);
    } else {
      applyFontSize('default'); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);


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

  const handleSaveApiKeyToDb = async () => {
    if (!token) {
      toast({ title: 'Authentication Error', description: 'Please log in again.', variant: 'destructive' });
      return;
    }
    if (!inputApiKey.trim()) {
      toast({ title: 'API Key Empty', description: 'Please enter an API key to save.', variant: 'destructive' });
      return;
    }
    setIsKeySaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey: inputApiKey.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setDbApiKey(inputApiKey.trim()); // Assume success means inputApiKey is now the stored key
        toast({
          title: 'API Key Saved',
          description: 'API key successfully stored in the database. Follow steps below for local dev server.',
          duration: 7000,
        });
      } else {
        toast({ title: 'Failed to save API key', description: data.error || 'Could not save API key to database.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error saving API key', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsKeySaving(false);
    }
  };

  const handleRemoveApiKeyFromDb = async () => {
    if (!token) {
      toast({ title: 'Authentication Error', description: 'Please log in again.', variant: 'destructive' });
      return;
    }
    setIsKeySaving(true); // Use same loading state for simplicity
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/api-key`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDbApiKey(null);
        setInputApiKey('');
        setShowApiKey(false);
        toast({ title: 'API Key Removed', description: 'API key successfully removed from the database.' });
      } else {
        toast({ title: 'Failed to remove API key', description: data.error || 'Could not remove API key from database.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error removing API key', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsKeySaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!dbApiKey && !inputApiKey) { // Check inputApiKey as fallback if dbApiKey might not be up-to-date
        toast({ title: 'No API Key', description: 'No API key is available to copy.', variant: 'destructive' });
        return;
    }
    const keyToCopy = inputApiKey || dbApiKey; // Prefer current input, fallback to DB key
    const instruction = `GOOGLE_API_KEY=${keyToCopy}`;
    navigator.clipboard.writeText(instruction).then(() => {
        toast({ title: 'Copied to Clipboard', description: 'Instructions copied. Paste into your .env.local file and restart server.' });
    }).catch(err => {
        toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
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

        <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-primary" /> Google AI API Key
            </CardTitle>
            <CardDescription>
              Configure the Google AI API Key for your organization. This key will be stored securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">
              The API key saved here is stored encrypted in the database for your organization.
              For local development, the AI features (Genkit) still require this key to be present in your <code>.env.local</code> file.
              Use this section to manage the key, and then ensure it's also set in your local environment.
            </p>
            {isKeyLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading API key status...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKeyInput">Organization's Google AI API Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="apiKeyInput"
                      type={showApiKey ? 'text' : 'password'}
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      placeholder="Enter Google AI API Key"
                      className="flex-grow"
                      disabled={isKeySaving}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)} aria-label={showApiKey ? 'Hide API Key' : 'Show API Key'} disabled={isKeySaving}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {dbApiKey && (
                  <p className="text-xs text-muted-foreground">
                    Currently stored in database: <span className="font-mono bg-muted px-1 py-0.5 rounded">{`${dbApiKey.substring(0, 4)}...${dbApiKey.slice(-4)}`}</span>
                  </p>
                )}
                 {!dbApiKey && !inputApiKey && (
                  <p className="text-xs text-muted-foreground">
                    No API key is currently configured for your organization in the database.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveApiKeyToDb} disabled={isKeySaving || (!inputApiKey.trim() && !dbApiKey) || inputApiKey.trim() === dbApiKey}>
                    {isKeySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {dbApiKey ? 'Update Stored Key' : 'Save Key to Database'}
                  </Button>
                  {dbApiKey && <Button variant="outline" onClick={handleRemoveApiKeyFromDb} disabled={isKeySaving}>
                    {isKeySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Remove Stored Key
                    </Button>}
                </div>
              </>
            )}
            <Alert variant="default" className="mt-4 border-blue-500 dark:border-blue-400">
              <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">Critical Activation Steps for Local Development AI Features</AlertTitle>
              <AlertDescription className="text-blue-600 dark:text-blue-200 space-y-2">
                <p>Saving the key to the database does NOT automatically activate AI features for your local development server.</p>
                <p>You MUST also perform the following steps for the local AI services to use your key:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 pl-4">
                  <li>Create or open the <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-sm">.env.local</code> file in the root directory of this project.</li>
                  <li>Add the following line to this file, replacing <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-sm">YOUR_API_KEY_HERE</code> with your actual Google AI API Key:
                    <pre className="mt-1 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs overflow-x-auto">GOOGLE_API_KEY={inputApiKey || dbApiKey || 'YOUR_API_KEY_HERE'}</pre>
                  </li>
                  <li><strong>Important:</strong> Stop your development server completely, and then restart it (e.g., re-run <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-sm">npm run dev</code>).</li>
                </ol>
                <p className="mt-2">If <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-sm">GOOGLE_API_KEY</code> is not correctly set in <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded text-sm">.env.local</code> and the server restarted, local AI features will not work.</p>
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard} className="mt-3 text-blue-700 border-blue-500 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-400 dark:hover:bg-blue-800" disabled={(!inputApiKey && !dbApiKey) || isKeyLoading}>
                  <Copy className="mr-2 h-4 w-4" /> Copy .env.local line
                </Button>
              </AlertDescription>
            </Alert>
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
