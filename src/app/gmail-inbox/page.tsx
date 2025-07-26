
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Send, Reply, ChevronRight, MailOpen, RefreshCw, Trash2, FileWarning, Link as LinkIcon, Calendar, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import Link from 'next/link';

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
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface EmailDraft {
    subject: string;
    body: string;
}

export default function GmailCalendarPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeMailbox, setActiveMailbox] = useState('inbox');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [replyBody, setReplyBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<EmailDraft[]>([]);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

  const { toast } = useToast();
  const { token, user } = useAuth();
  const isGuest = user?.organizationId === 'guest-org-id';

  const checkAuthStatus = useCallback(async () => {
    if (!token || isGuest) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
    }
    try {
        const response = await fetch('/api/google-auth/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setIsAuthenticated(response.ok && data.isAuthenticated);
    } catch (error) {
        setIsAuthenticated(false);
    } finally {
        setIsLoading(false);
    }
  }, [token, isGuest]);

  const fetchData = useCallback(async (isInitialLoad = true, pageToken: string | null = null) => {
    if (!isAuthenticated || !token) return;

    if (isInitialLoad) {
      setIsLoading(true);
      setSelectedEmail(null);
      setEmails([]);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
        let emailsUrl = `/api/google/emails?mailbox=${activeMailbox}`;
        if (pageToken) emailsUrl += `&pageToken=${pageToken}`;
        if (activeCategory !== 'all') emailsUrl += `&category=${activeCategory}`;
        
        const [emailsRes, eventsRes] = await Promise.all([
            fetch(emailsUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
            isInitialLoad ? fetch(`/api/google/calendars/primary/events`, { headers: { 'Authorization': `Bearer ${token}` } }) : Promise.resolve(null)
        ]);
        
        if (emailsRes.ok) {
            const data = await emailsRes.json();
            setEmails(prev => isInitialLoad ? data.emails : [...prev, ...data.emails]);
            setNextPageToken(data.nextPageToken || null);
        } else {
            toast({ title: "Error fetching emails", variant: "destructive" });
        }

        if (eventsRes && eventsRes.ok) {
            setCalendarEvents(await eventsRes.json());
        } else if (eventsRes && !eventsRes.ok) {
            toast({ title: "Error fetching calendar events", variant: "destructive" });
        }
        
    } catch (error) {
        toast({ title: "Error fetching data", variant: "destructive" });
    } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
    }
  }, [isAuthenticated, token, activeMailbox, activeCategory, toast]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);
  
  useEffect(() => {
      if(isAuthenticated) {
          fetchData(true);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMailbox, activeCategory]);

  const handleLoadMore = () => {
    if (nextPageToken && !isLoadingMore) {
      fetchData(false, nextPageToken);
    }
  };

  const handleConnectGoogleAccount = () => {
    if (!token) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
    }
    document.cookie = `authToken=${token}; path=/; max-age=300`;
    window.location.href = `/api/google-auth/connect`;
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setReplyBody('');
    setShowCalendar(false);
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/google/emails/${selectedEmail.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to delete email.');
      }
      toast({ title: 'Email Deleted' });
      setSelectedEmail(null);
      await fetchData(true); // Full refresh
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReplies = async () => {
    if (!selectedEmail) return;
    setIsGenerating(true);
    setGeneratedDrafts([]);
    try {
        const userApiKey = localStorage.getItem('userApiKey');
        const input: GenerateDraftEmailResponsesInput = { 
            query: `From: ${selectedEmail.from}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`,
            apiKey: userApiKey,
            userId: user?.id,
            organizationId: user?.organizationId,
        };
        const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
        if (result.drafts?.length) {
            setGeneratedDrafts(result.drafts);
            setIsDraftsModalOpen(true);
        } else {
            toast({ title: "No replies generated", description: "The AI could not generate replies for this email.", variant: "destructive" });
        }
    } catch(error: any) {
        toast({ title: 'Error', description: 'Failed to generate AI replies.', variant: 'destructive' });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !replyBody.trim()) return;
    setIsSending(true);
    try {
        const response = await fetch('/api/google/emails/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                to: selectedEmail.from,
                subject: `Re: ${selectedEmail.subject}`,
                message: replyBody,
                threadId: selectedEmail.threadId,
            })
        });
        if (!response.ok) {
            throw new Error('Failed to send reply.');
        }
        toast({ title: 'Reply Sent' });
        setReplyBody('');
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsSending(false);
    }
  };

  const formatEventTime = (eventTime: { dateTime?: string, date?: string } | undefined) => {
    if (!eventTime) return 'N/A';
    // All-day event
    if (eventTime.date) {
        return format(new Date(eventTime.date), 'MMM d, yyyy');
    }
    // Specific time event
    if (eventTime.dateTime) {
        return format(new Date(eventTime.dateTime), 'MMM d, h:mm a');
    }
    return 'N/A';
  };
  
  if (isGuest) {
    return (
      <>
        <PageHeader
          title="Gmail & Calendar"
          description="This feature is unavailable in guest mode."
          className="mb-4"
        />
        <Card className="text-center p-8 flex flex-col items-center justify-center min-h-[500px]">
          <Lock className="h-16 w-16 text-primary mb-4" />
          <CardHeader>
            <CardTitle>Feature Locked</CardTitle>
            <CardDescription>Connect your Google account and manage emails and calendars after logging in or registering.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
             <Button asChild>
                <Link href="/login">Log In</Link>
             </Button>
             <Button asChild variant="outline">
                <Link href="/register">Register</Link>
             </Button>
          </CardContent>
        </Card>
      </>
    );
  }


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
        <Button variant="outline" onClick={() => fetchData(true)} disabled={isLoading || !isAuthenticated}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 shadow-lg flex flex-col h-full min-h-0">
                <CardHeader className="p-4 border-b">
                    <CardTitle className="text-lg">Inbox & Calendar</CardTitle>
                    <CardDescription>View emails or calendar events.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-3">
                            <Button
                                variant={showCalendar ? "secondary" : "outline"}
                                className="w-full justify-start py-2"
                                onClick={() => { setShowCalendar(true); setSelectedEmail(null); }}
                            >
                                <Calendar className="mr-2 h-4 w-4" /> Calendar Events
                            </Button>
                            <Separator />
                             <div className="space-y-2">
                                <Label>Mailbox</Label>
                                <Select onValueChange={setActiveMailbox} defaultValue={activeMailbox}>
                                    <SelectTrigger><SelectValue placeholder="Select a mailbox" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inbox">Inbox</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="spam">Spam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Category</Label>
                                <Select onValueChange={setActiveCategory} defaultValue={activeCategory}>
                                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="social">Social</SelectItem>
                                        <SelectItem value="promotions">Promotions</SelectItem>
                                        <SelectItem value="updates">Updates</SelectItem>
                                        <SelectItem value="forums">Forums</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                            {isLoading && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>}
                            {!isLoading && emails.length === 0 && (
                                <div className="text-center text-muted-foreground p-6"><FileWarning className="h-12 w-12 mx-auto mb-2" /><p>No emails in {activeMailbox}.</p></div>
                            )}
                            {emails.map((email) => (
                                <Card key={email.id} className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedEmail?.id === email.id ? 'bg-secondary' : 'bg-card'} mb-2`} onClick={() => handleSelectEmail(email)}>
                                    <div className="flex justify-between items-start w-full gap-2"><p className="text-sm font-semibold line-clamp-1 min-w-0">{email.from || email.to}</p><ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" /></div>
                                    <p className="text-sm line-clamp-1">{email.subject}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                                    {email.date && <p className="text-xs text-muted-foreground mt-1">{new Date(email.date).toLocaleString()}</p>}
                                </Card>
                            ))}
                            {nextPageToken && (
                              <Button variant="outline" className="w-full" onClick={handleLoadMore} disabled={isLoadingMore}>
                                {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Load More'}
                              </Button>
                            )}
                            </div>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="md:col-span-2">
              {!selectedEmail && !showCalendar && (
                  <Card className="shadow-lg flex items-center justify-center min-h-[500px] md:min-h-full">
                      <div className="text-center p-6"><MailOpen className="h-24 w-24 text-muted-foreground mx-auto mb-4" /><p className="text-xl font-semibold text-muted-foreground">Select an email or calendar view</p></div>
                  </Card>
              )}
              {showCalendar && (
                <Card className="shadow-lg h-full">
                  <CardHeader className="p-4 border-b"><CardTitle className="text-lg">Calendar Events</CardTitle></CardHeader>
                  <CardContent className="p-4 space-y-4">
                      {calendarEvents.map((event) => (
                        <Card key={event.id} className="p-3">
                            <p className="text-sm font-semibold">{event.summary}</p>
                            <div className="text-xs text-muted-foreground mt-2 grid grid-cols-[auto,1fr] gap-x-2">
                                <span className="font-medium">From:</span>
                                <span>{formatEventTime(event.start)}</span>
                                <span className="font-medium">To:</span>
                                <span>{formatEventTime(event.end)}</span>
                            </div>
                        </Card>
                      ))}
                      {calendarEvents.length === 0 && <p className="text-center text-muted-foreground">No upcoming events.</p>}
                  </CardContent>
                </Card>
              )}
              {selectedEmail && (
                <Card className="shadow-lg">
                    <CardHeader className="p-4 flex-row items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
                        <div>
                            <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                            <CardDescription className="line-clamp-1">From: {selectedEmail.from} | To: {selectedEmail.to || 'You'}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <ScrollArea className="h-64 border rounded-md p-3">
                          <div className="text-sm whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: selectedEmail.body.replace(/(<style.*?>.*?<\/style>)/g, '') }} />
                        </ScrollArea>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="text-md font-semibold flex items-center"><Reply className="mr-2 h-4 w-4"/>Respond</h3>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={handleGenerateReplies} disabled={isGenerating}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>} Generate AI Reply Options</Button>
                                 <Button variant="destructive" size="sm" onClick={handleDeleteEmail}><Trash2 className="mr-2 h-4 w-4"/>Delete Email</Button>
                            </div>
                            <form onSubmit={handleSendReply}>
                                <Textarea placeholder="Manually compose your reply..." value={replyBody} onChange={(e) => setReplyBody(e.target.value)} className="min-h-[100px] mb-2"/>
                                <Button type="submit" disabled={isSending || !replyBody.trim()}>{isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>} Send Reply</Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
              )}
            </div>
        </div>
      )}

      <Dialog open={isDraftsModalOpen} onOpenChange={setIsDraftsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>AI Generated Reply Options</DialogTitle>
            <DialogDescription>Select a draft to use as your reply.</DialogDescription>
          </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1"><div className="p-4 space-y-4">
                {generatedDrafts.map((draft, index) => (
                    <Card key={index}><CardHeader className="pb-2"><CardTitle className="text-base">{draft.subject}</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="text-sm whitespace-pre-wrap font-sans bg-secondary p-2 rounded-md max-h-40 overflow-y-auto">{draft.body}</pre>
                        <Button className="mt-2 w-full" onClick={() => { setReplyBody(draft.body); setIsDraftsModalOpen(false); }}>Use this draft</Button>
                    </CardContent></Card>
                ))}
            </div></ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
