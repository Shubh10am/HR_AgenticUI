
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Send, Reply, ChevronRight, MailOpen, RefreshCw, Trash2, FileWarning, Link as LinkIcon, Calendar, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';

interface Email {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date?: string;
  to?: string;
  category?: string;
  attachments?: Array<{
    filename: string;
    attachmentId: string;
    size: number;
    mimeType: string;
  }>;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  status: string;
  created: string;
  updated: string;
  attendees: Array<{ email: string }>;
  organizer: { email: string };
  calendar_id: string;
}

export default function GmailCalendarPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeSection, setActiveSection] = useState('inbox');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();


  const checkAuthStatus = useCallback(async () => {
    if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
    }
    try {
        const response = await fetch('/api/google-auth/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.isAuthenticated) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    } catch (error) {
        setIsAuthenticated(false);
    } finally {
        setIsLoading(false);
    }
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setIsLoading(true);
    try {
        const [emailsRes, eventsRes] = await Promise.all([
            fetch(`/api/google/emails?mailbox=${activeSection}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`/api/google/calendars/primary/events`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (emailsRes.ok) {
            const emailsData = await emailsRes.json();
            setEmails(emailsData);
        } else {
            toast({ title: "Error fetching emails", variant: "destructive" });
        }

        if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setCalendarEvents(eventsData);
        } else {
            toast({ title: "Error fetching calendar events", variant: "destructive" });
        }
        
    } catch (error) {
        toast({ title: "Error fetching data", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [isAuthenticated, token, activeSection, toast]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);
  
  useEffect(() => {
      if(isAuthenticated) {
          fetchData();
      }
  }, [isAuthenticated, fetchData]);

  const handleConnectGoogleAccount = () => {
    if (!token) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
    }
    // Pass token via cookie or state parameter for the backend to use after redirect
    document.cookie = `authToken=${token}; path=/; max-age=300`;
    window.location.href = `/api/google-auth/connect`;
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setShowCalendar(false);
  };
  
  const handleSelectCalendarView = () => {
    setSelectedEmail(null);
    setShowCalendar(true);
  };
  
  const formatEmailBody = (body: string) => {
    return body.replace(/\r\n/g, '\n');
  };

  const mainGridClasses = "grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]";
  const detailCardClasses = "md:col-span-2 shadow-lg flex flex-col h-full min-h-0";

  return (
    <>
      <PageHeader
        title="Gmail & Calendar"
        description="Manage your emails and calendar events."
        className="mb-4"
      >
        {!isAuthenticated && (
          <Button onClick={handleConnectGoogleAccount} disabled={isLoading}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Connect Google Account
          </Button>
        )}
        <Button variant="outline" onClick={fetchData} disabled={isLoading || !isAuthenticated}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </PageHeader>
      
       {!isAuthenticated && !isLoading && (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>Connect Your Google Account</CardTitle>
            <CardDescription>To view your emails and calendar events, you need to connect your Google account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnectGoogleAccount}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect Now
            </Button>
          </CardContent>
        </Card>
      )}


      {isAuthenticated && (
        <div className={mainGridClasses}>
            <Card className="md:col-span-1 shadow-lg flex flex-col h-full min-h-0">
            <CardHeader className="p-4">
                <CardTitle className="text-lg">Inbox & Calendar</CardTitle>
                <CardDescription>View emails or calendar events.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                    <Button
                    variant={showCalendar ? "secondary" : "outline"}
                    className="w-full justify-start py-2"
                    onClick={handleSelectCalendarView}
                    >
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar Events
                    </Button>
                    <Separator />
                    <Select onValueChange={setActiveSection} defaultValue="inbox">
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a mailbox" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inbox">Inbox</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="spam">Spam</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="space-y-2">
                    {isLoading && (
                        <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        </div>
                    )}
                    {emails.map((email) => (
                        <Card
                        key={email.id}
                        className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedEmail?.id === email.id ? 'bg-secondary' : 'bg-card'} mb-2`}
                        onClick={() => handleSelectEmail(email)}
                        >
                        <div className="flex justify-between items-start w-full gap-2">
                            <p className="text-sm font-semibold line-clamp-1 min-w-0">{email.from || email.to}</p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <p className="text-sm line-clamp-1">{email.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                        {email.date && <p className="text-xs text-muted-foreground mt-1">{new Date(email.date).toLocaleString()}</p>}
                        </Card>
                    ))}
                    {!isLoading && emails.length === 0 && (
                        <div className="text-center text-muted-foreground p-6">
                        <FileWarning className="h-12 w-12 mx-auto mb-2" />
                        <p>No emails to display in {activeSection}.</p>
                        </div>
                    )}
                    </div>
                </div>
                </ScrollArea>
            </CardContent>
            </Card>

            <Card className={detailCardClasses}>
            {!selectedEmail && !showCalendar ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                <MailOpen className="h-24 w-24 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">Select an email or calendar view</p>
                </div>
            ) : showCalendar ? (
                <>
                <CardHeader className="p-4">
                    <CardTitle className="text-lg">Calendar Events</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow p-0 min-h-0">
                    <CardContent className="p-4 space-y-4">
                    {calendarEvents.map((event) => (
                        <Card key={event.id} className="p-3">
                        <p className="text-sm font-semibold">{event.summary}</p>
                        <p className="text-xs text-muted-foreground">Start: {new Date(event.start).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">End: {new Date(event.end).toLocaleString()}</p>
                        </Card>
                    ))}
                    {calendarEvents.length === 0 && <p className="text-center text-muted-foreground">No upcoming events.</p>}
                    </CardContent>
                </ScrollArea>
                </>
            ) : (
                <>
                <CardHeader className="p-4">
                    <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                     <div className="flex justify-between items-center gap-2">
                        <CardDescription className="line-clamp-1">From: {selectedEmail.from}</CardDescription>
                        <CardDescription className="line-clamp-1">To: {selectedEmail.to || 'You'}</CardDescription>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-grow p-0 min-h-0 border-t border-b">
                    <CardContent className="p-4 space-y-4">
                    <pre className="text-sm whitespace-pre-wrap">{formatEmailBody(selectedEmail.body)}</pre>
                    </CardContent>
                </ScrollArea>
                <div className="p-4 border-t bg-background">
                    <p className="text-muted-foreground">Actions placeholder</p>
                </div>
                </>
            )}
            </Card>
        </div>
      )}
    </>
  );
}

    