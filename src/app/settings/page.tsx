
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Bell, Palette, Plug, ChevronRight, KeyRound, Eye, EyeOff, Copy, Info, Loader2, Volume2, Sun, Moon, Laptop, VolumeX, Volume1, BarChart, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const NOTIFICATION_SOUND_ENABLED_KEY = 'notificationSoundEnabled';
const NOTIFICATION_SOUND_VOLUME_KEY = 'notificationSoundVolume';

export default function SettingsPage() {
  const { toast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationVolume, setNotificationVolume] = useState(10);
  const { theme, setTheme } = useTheme();
  
  const { token, user, setUserApiKey: setApiKeyInContext, logout } = useAuth();
  const isGuest = user?.organizationId === 'guest-org-id';

  const [dbApiKey, setDbApiKey] = useState<string | null>(null);
  const [inputApiKey, setInputApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isKeyLoading, setIsKeyLoading] = useState(true);
  const [isKeySaving, setIsKeySaving] = useState(false);

  const [tokenUsage, setTokenUsage] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(500000);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  const [nextResetDate, setNextResetDate] = useState('');

  // State for password change
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // State for account deletion
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [orgNameConfirm, setOrgNameConfirm] = useState('');
  const [orgName, setOrgName] = useState(''); // To store org name for confirmation

  
  const fetchApiKey = useCallback(async () => {
    if (!token || token.startsWith('guest-')) {
        setIsKeyLoading(false);
        return;
    };
    setIsKeyLoading(true);
    try {
      const response = await fetch(`/api/settings/api-key`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDbApiKey(data.apiKey || null);
        setInputApiKey(data.apiKey || '');
        if (data.organizationName) setOrgName(data.organizationName); // Set org name if returned
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

  const fetchUsageData = useCallback(async () => {
    if (!token || token.startsWith('guest-')) {
      setIsUsageLoading(false);
      return;
    }
    setIsUsageLoading(true);
    try {
      const response = await fetch(`/api/settings/usage`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTokenUsage(data.usage);
        setTokenLimit(data.limit);
        const resetDate = new Date(data.cycleEndDate);
        setNextResetDate(resetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'}));
      } else {
        toast({ title: "Could not fetch usage data", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Usage Fetch Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsUsageLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSoundPreference = localStorage.getItem(NOTIFICATION_SOUND_ENABLED_KEY);
      if (storedSoundPreference !== null) {
        setSoundEnabled(storedSoundPreference === 'true');
      }
      const storedVolume = localStorage.getItem(NOTIFICATION_SOUND_VOLUME_KEY);
      if (storedVolume !== null) {
        setNotificationVolume(parseInt(storedVolume, 10));
      }
    }

    fetchUsageData();
    fetchApiKey();
    
  }, [fetchApiKey, fetchUsageData]);

  const handleMockAction = (action: string) => {
    toast({
      title: `${action} (Mock)`,
      description: `This action is for demonstration purposes.`,
    });
  };

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    localStorage.setItem(NOTIFICATION_SOUND_ENABLED_KEY, String(checked));
    toast({
      title: `Notification Sounds ${checked ? 'Enabled' : 'Disabled'}`,
    });
  };

  const handleVolumeChange = (volumeArray: number[]) => {
    const newVolume = volumeArray[0];
    setNotificationVolume(newVolume);
    localStorage.setItem(NOTIFICATION_SOUND_VOLUME_KEY, String(newVolume));
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    toast({
      title: `Theme Changed`,
      description: `Switched to ${value.charAt(0).toUpperCase() + value.slice(1)} theme.`,
    });
  };
  
  const handleChangePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!token) {
      toast({ title: 'Authentication error', variant: 'destructive' });
      return;
    }
    setIsPasswordChanging(true);
    try {
      const response = await fetch(`/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }
      toast({ title: 'Password Changed Successfully' });
      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPasswordChanging(false);
    }
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
      const response = await fetch(`/api/settings/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey: inputApiKey.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        const newKey = inputApiKey.trim();
        setDbApiKey(newKey);
        setApiKeyInContext(newKey);
        localStorage.setItem('userApiKey', newKey);
        toast({
          title: 'API Key Saved',
          description: "Your organization's API key has been securely saved and is now active for this session.",
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
    setIsKeySaving(true);
    try {
      const response = await fetch(`/api/settings/api-key`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDbApiKey(null);
        setInputApiKey('');
        setShowApiKey(false);
        setApiKeyInContext(null);
        localStorage.removeItem('userApiKey');
        setTokenUsage(0); // Reset token usage in UI
        toast({ title: 'API Key Removed', description: 'Your key has been removed. The application will now use the fallback key, if available.' });
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
    if (!inputApiKey && !dbApiKey) {
        toast({ title: 'No API Key', description: 'No API key is available to copy.', variant: 'destructive' });
        return;
    }
    const keyToCopy = inputApiKey || dbApiKey || '';
    navigator.clipboard.writeText(keyToCopy).then(() => {
        toast({ title: 'Copied to Clipboard', description: 'API Key copied to clipboard.' });
    }).catch(err => {
        toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    });
  };

  const handleDeleteAccountSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsDeleting(true);
    try {
        const response = await fetch(`/api/profile/delete-account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                password: passwordConfirm,
                ...(user?.role === 'Admin' && { organizationName: orgNameConfirm }),
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete account.');
        }

        toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
        setIsDeleteDialogOpen(false);
        logout(); // Log out the user after successful deletion
    } catch (error: any) {
        toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setPasswordConfirm('');
        setOrgNameConfirm('');
    }
  };

  const isDeleteConfirmed = () => {
    if (user?.role === 'Admin') {
      return passwordConfirm.length > 0 && orgNameConfirm === orgName;
    }
    return passwordConfirm.length > 0;
  };

  return (
    <>
      <PageHeader
        title="Application Settings"
        description="Configure your application preferences and account details."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5 text-primary" /> Account
            </CardTitle>
            <CardDescription>Manage your account security and details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" disabled={isGuest}>
                      Change Password
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Change Your Password</DialogTitle>
                      <DialogDescription>Enter your current password and a new one. Click save when you're done.</DialogDescription>
                  </DialogHeader>
                  <form id="change-password-form" onSubmit={handleChangePasswordSubmit}>
                      <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={isPasswordChanging} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isPasswordChanging} minLength={6} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                              <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required disabled={isPasswordChanging} />
                          </div>
                      </div>
                  </form>
                   <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="outline" disabled={isPasswordChanging}>Cancel</Button>
                      </DialogClose>
                      <Button type="submit" form="change-password-form" disabled={isPasswordChanging}>
                          {isPasswordChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="twoFactor" className="flex flex-col space-y-1">
                <span>Two-Factor Authentication</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Enhance your account security.
                </span>
              </Label>
              <Switch id="twoFactor" disabled checked={false} aria-readonly />
            </div>
             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start" disabled={isGuest}>
                        Delete Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <form id="delete-account-form" onSubmit={handleDeleteAccountSubmit}>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                               <Terminal className="mr-2 h-5 w-5"/> Are you absolutely sure?
                            </AlertDialogTitle>
                            {user?.role === 'Admin' ? (
                                <AlertDialogDescription className="text-destructive/90">
                                    This action is irreversible. Deleting your admin account will permanently delete the entire <strong>{orgName}</strong> organization, including all employee accounts, attendance data, and settings.
                                </AlertDialogDescription>
                            ) : (
                                <AlertDialogDescription>
                                    This will permanently delete your account and all associated data. This action cannot be undone.
                                </AlertDialogDescription>
                            )}
                        </AlertDialogHeader>
                        <div className="py-4 space-y-4">
                            {user?.role === 'Admin' && (
                                <div>
                                    <Label htmlFor="orgNameConfirm">To confirm, type your organization name: <span className="font-bold">{orgName}</span></Label>
                                    <Input id="orgNameConfirm" value={orgNameConfirm} onChange={(e) => setOrgNameConfirm(e.target.value)} required disabled={isDeleting}/>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="passwordConfirm">Please enter your password to confirm</Label>
                                <Input id="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required disabled={isDeleting}/>
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <Button type="submit" variant="destructive" disabled={isDeleting || !isDeleteConfirmed()}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {user?.role === 'Admin' ? 'Delete Organization' : 'Delete My Account'}
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
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
              {soundEnabled && (
                <div className="pt-2 space-y-2">
                  <Label htmlFor="volumeSlider" className="text-sm flex items-center text-muted-foreground">
                    {notificationVolume === 0 ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume1 className="mr-2 h-4 w-4" />}
                     Sound Volume: {notificationVolume}%
                  </Label>
                  <Slider
                    id="volumeSlider"
                    min={0}
                    max={100}
                    step={1}
                    value={[notificationVolume]}
                    onValueChange={handleVolumeChange}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <KeyRound className="mr-2 h-5 w-5 text-primary" /> API Key Configuration
            </CardTitle>
            <CardDescription>
             Configure your organization's Google AI API Key. The key is stored encrypted and used for all AI features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isKeyLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading API key status...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKeyInput">Google AI API Key for your Organization</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
                    <Input
                      id="apiKeyInput"
                      type={showApiKey ? 'text' : 'password'}
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      placeholder="Enter Google AI API Key"
                      className="flex-grow"
                      disabled={isKeySaving}
                    />
                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)} aria-label={showApiKey ? 'Hide API Key' : 'Show API Key'} disabled={isKeySaving}>
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleCopyToClipboard} disabled={(!inputApiKey && !dbApiKey) || isKeyLoading}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy API Key</span>
                        </Button>
                    </div>
                  </div>
                </div>
                {dbApiKey && (
                  <p className="text-xs text-muted-foreground">
                    Key currently stored in database: <span className="font-mono bg-muted px-1 py-0.5 rounded">{`${dbApiKey.substring(0, 4)}...${dbApiKey.slice(-4)}`}</span>
                  </p>
                )}
                 {!dbApiKey && !inputApiKey && (
                  <p className="text-xs text-muted-foreground">
                    No API key is currently configured for your organization in the database.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveApiKeyToDb} disabled={isKeySaving || (!inputApiKey.trim() && !dbApiKey) || (dbApiKey !== null && inputApiKey.trim() === dbApiKey)}>
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
              <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">API Key Usage</AlertTitle>
              <AlertDescription className="text-blue-600 dark:text-blue-200 space-y-2">
                  <p>
                    This API key will be used for all AI features within your organization. Once saved, it is fetched upon login and stored in your browser's local storage for the current session.
                  </p>
                  <p>
                    If no key is provided here, the application will attempt to use a global fallback key set by the system administrator. If the fallback is also not available, AI features will be disabled.
                  </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-primary" /> API Usage Tracking
            </CardTitle>
            <CardDescription>
              Monitor your organization's token usage for the current billing cycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isUsageLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading usage data...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm text-muted-foreground">Current cycle usage</p>
                    <p className="text-2xl font-bold text-primary">
                      {tokenUsage.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground"> / {tokenLimit.toLocaleString()} tokens</span>
                    </p>
                  </div>
                  <Progress value={(tokenUsage / tokenLimit) * 100} className="h-3" />
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Cycle resets on: {nextResetDate}</span>
                  <span>Based on UTC time.</span>
                </div>
                {(token && token.startsWith('guest-')) && (
                  <Alert variant="default" className="mt-4 border-amber-500 dark:border-amber-400">
                    <Info className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    <AlertTitle className="text-amber-700 dark:text-amber-300 font-semibold">Guest Mode</AlertTitle>
                    <AlertDescription className="text-amber-600 dark:text-amber-200">
                      Usage tracking is not available for guest users.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
