
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Send, Reply, MailOpen, RefreshCw, Trash2, FileWarning, Link as LinkIcon, Calendar, File as FileIcon, Sparkles, Inbox, AlertOctagon, Users, Tag, Info, MessagesSquare, Mail, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fetchKnowledgeContext } from '@/lib/knowledge-client';
import AiReplyAssistant, { type ReplyIntent } from './ai-reply-assistant';
import { AiTipBanner, EmailBodyFrame, EmailListItem, SenderAvatar, VerificationCodeCard, detectVerificationCode, formatEmailDate, parseSender, type Email } from './inbox-components';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import Link from 'next/link';

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
  
  // State for quick reply
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [quickReplyPrompt, setQuickReplyPrompt] = useState('');
  const [isGeneratingQuickReply, setIsGeneratingQuickReply] = useState(false);
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null);
  const [isAiTipVisible, setIsAiTipVisible] = useState(false);
  const [highlightAssistant, setHighlightAssistant] = useState(false);

  useEffect(() => {
    setIsAiTipVisible(localStorage.getItem('gmailAiTipDismissed') !== 'true');
  }, []);

  const dismissAiTip = () => {
    localStorage.setItem('gmailAiTipDismissed', 'true');
    setIsAiTipVisible(false);
  };


  const { toast } = useToast();
  const { token, user } = useAuth();
  const isGuest = user?.organizationId === 'guest-org-id';
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);


  const checkAuthStatus = useCallback(async () => {
    if (!token || isGuest) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
    }
    setIsLoading(true);
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
    if (isGuest) {
        setIsLoginPromptOpen(true);
        return;
    }
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

  const handleAiReplyFromList = (email: Email) => {
    handleSelectEmail(email);
    setHighlightAssistant(true);
    setTimeout(() => setHighlightAssistant(false), 1600);
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

  /** Policy passages relevant to this email, so AI replies quote the company's real rules. */
  const getKnowledgeForEmail = async (email: Email, instruction?: string) => {
    const passages = await fetchKnowledgeContext(token, [email.subject, email.snippet, instruction].filter(Boolean).join('\n'));
    return passages.map(({ sourceName, text }) => ({ sourceName, text }));
  };

  const handleGenerateReplies = async () => {
    if (!selectedEmail) return;
    setIsGenerating(true);
    setGeneratedDrafts([]);
    try {
        const knowledgeContext = await getKnowledgeForEmail(selectedEmail);
        const input: GenerateDraftEmailResponsesInput = { 
            query: `From: ${selectedEmail.from}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`,
            knowledgeContext,
            authToken: token,
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

  const runQuickReply = async (prompt: string): Promise<boolean> => {
    if (!selectedEmail || !prompt.trim()) return false;
    try {
        const knowledgeContext = await getKnowledgeForEmail(selectedEmail, prompt);
        const input: GenerateDraftEmailResponsesInput = { 
            query: `From: ${selectedEmail.from}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`,
            knowledgeContext,
            prompt,
            authToken: token,
            userId: user?.id,
            organizationId: user?.organizationId,
        };
        const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
        if (result.drafts && result.drafts.length > 0) {
            setReplyBody(result.drafts[0].body);
            toast({ title: 'Quick Reply Generated', description: 'The email body has been populated.' });
            return true;
        }
        toast({ title: 'Generation Failed', description: 'Could not generate a reply from your prompt.', variant: 'destructive' });
    } catch (error) {
        toast({ title: 'Quick Reply Error', description: 'Failed to generate quick reply.', variant: 'destructive' });
    }
    return false;
  };

  const handleQuickReply = async (event: FormEvent) => {
    event.preventDefault();
    setIsGeneratingQuickReply(true);
    const isDone = await runQuickReply(quickReplyPrompt);
    if (isDone) {
        setIsQuickReplyOpen(false);
        setQuickReplyPrompt('');
    }
    setIsGeneratingQuickReply(false);
  };

  const handleReplyIntent = async (intent: ReplyIntent) => {
    setActiveIntentId(intent.id);
    await runQuickReply(intent.prompt);
    setActiveIntentId(null);
    document.getElementById('gmail-reply-body')?.focus();
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
    if (eventTime.date) {
        return format(new Date(eventTime.date), 'MMM d, yyyy');
    }
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
            description="Manage your emails and calendar events with AI assistance."
        >
            <Button onClick={handleConnectGoogleAccount}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect Google Account
            </Button>
        </PageHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 shadow-lg flex flex-col h-full min-h-0">
                <CardHeader className="p-4 border-b">
                    <CardTitle className="text-lg">Inbox & Calendar</CardTitle>
                    <CardDescription>View emails or calendar events.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                    <div className="p-4 space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start py-2"
                            disabled
                        >
                            <Calendar className="mr-2 h-4 w-4" /> Calendar Events
                        </Button>
                        <div className="space-y-2">
                           <Label>Inbox</Label>
                           <Select disabled>
                               <SelectTrigger>
                                   <SelectValue placeholder="Inbox"/>
                               </SelectTrigger>
                           </Select>
                        </div>
                        <div className="text-center text-muted-foreground p-6">
                            <FileIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Please connect your Google account to view emails.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="md:col-span-2">
                 <Card className="shadow-lg flex items-center justify-center min-h-[500px] md:min-h-full">
                      <div className="text-center p-6"><MailOpen className="h-24 w-24 text-muted-foreground mx-auto mb-4" /><p className="text-xl font-semibold text-muted-foreground">Select an email or calendar view</p><p className="text-sm text-muted-foreground">Content will appear here.</p></div>
                  </Card>
            </div>
        </div>

        <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Connect Your Account</DialogTitle>
                    <DialogDescription>
                        Please log in or register to connect your Google account and use this feature.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button asChild variant="outline" onClick={() => setIsLoginPromptOpen(false)}><Link href="/register">Register</Link></Button>
                    <Button asChild onClick={() => setIsLoginPromptOpen(false)}><Link href="/login">Log In</Link></Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
  }


  const mailboxes = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'spam', label: 'Spam', icon: AlertOctagon },
  ];
  const categories = [
    { id: 'all', label: 'All', icon: Inbox },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'promotions', label: 'Promotions', icon: Tag },
    { id: 'updates', label: 'Updates', icon: Info },
    { id: 'forums', label: 'Forums', icon: MessagesSquare },
  ];
  const selectedSender = selectedEmail ? parseSender(selectedEmail.from) : null;
  const selectedCode = selectedEmail ? detectVerificationCode(selectedEmail) : null;
  const isReading = Boolean(selectedEmail) || showCalendar;

  return (
    <>
      <PageHeader
        title="Gmail & Calendar"
        description="Manage your emails and calendar events."
      >
        {!isAuthenticated && (
          <Button onClick={handleConnectGoogleAccount} disabled={isLoading} id="gmail-connect">
            <LinkIcon className="h-4 w-4" />
            Connect Google Account
          </Button>
        )}
      </PageHeader>

      {!isAuthenticated && !isLoading && (
        <Card className="flex flex-col items-center p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Mail className="h-7 w-7" /></span>
          <h2 className="mt-4 text-xl font-semibold">Connect your Google account</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">To view your emails and calendar events, you need to connect your Google account.</p>
          <Button className="mt-6" onClick={handleConnectGoogleAccount} id="gmail-connect-now">
            <LinkIcon className="h-4 w-4" />
            Connect now
          </Button>
        </Card>
      )}

      {isAuthenticated && (
        <Card className="grid h-[calc(100vh-13rem)] min-h-[560px] grid-cols-1 overflow-hidden md:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:grid-cols-[190px_minmax(300px,380px)_minmax(0,1fr)]">
          {/* Folder rail */}
          <nav className="hidden flex-col gap-1 border-r bg-secondary/30 p-3 lg:flex" aria-label="Mailboxes">
            {mailboxes.map((mailbox) => {
              const isActive = !showCalendar && activeMailbox === mailbox.id;
              return (
                <button
                  key={mailbox.id}
                  type="button"
                  id={`gmail-mailbox-${mailbox.id}`}
                  onClick={() => { setShowCalendar(false); setActiveMailbox(mailbox.id); }}
                  className={cn('flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary/15 font-semibold text-primary' : 'text-foreground/80 hover:bg-secondary')}
                >
                  <mailbox.icon className="h-4 w-4" />{mailbox.label}
                </button>
              );
            })}
            <Separator className="my-2" />
            <button
              type="button"
              id="gmail-calendar"
              onClick={() => { setShowCalendar(true); setSelectedEmail(null); }}
              className={cn('flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors', showCalendar ? 'bg-primary/15 font-semibold text-primary' : 'text-foreground/80 hover:bg-secondary')}
            >
              <Calendar className="h-4 w-4" />Calendar
            </button>
          </nav>

          {/* Message list */}
          <div className={cn('min-h-0 flex-col border-r', isReading ? 'hidden md:flex' : 'flex')}>
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <div className="flex items-center gap-1 lg:hidden">
                {mailboxes.map((mailbox) => (
                  <Button key={mailbox.id} id={`gmail-mailbox-compact-${mailbox.id}`} size="sm" variant={!showCalendar && activeMailbox === mailbox.id ? 'secondary' : 'ghost'} className="h-8 rounded-full" onClick={() => { setShowCalendar(false); setActiveMailbox(mailbox.id); }}>
                    {mailbox.label}
                  </Button>
                ))}
                <Button id="gmail-calendar-compact" size="icon" variant={showCalendar ? 'secondary' : 'ghost'} className="h-8 w-8 rounded-full" aria-label="Calendar" onClick={() => { setShowCalendar(true); setSelectedEmail(null); }}>
                  <Calendar />
                </Button>
              </div>
              <span className="hidden text-sm font-semibold capitalize lg:block">{activeMailbox}</span>
              <Button id="gmail-refresh" variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Refresh" onClick={() => fetchData(true)} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              </Button>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b px-2" role="tablist" aria-label="Categories">
              {categories.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    id={`gmail-category-${category.id}`}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn('flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors', isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
                  >
                    <category.icon className="h-3.5 w-3.5" />{category.label}
                  </button>
                );
              })}
            </div>
            {isAiTipVisible && activeMailbox === 'inbox' && <AiTipBanner onDismiss={dismissAiTip} />}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading && (
                <div className="space-y-px">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex gap-3 border-b px-4 py-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-2/3" /></div>
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && emails.length === 0 && (
                <div className="p-10 text-center text-muted-foreground"><FileWarning className="mx-auto mb-2 h-10 w-10 opacity-60" /><p className="text-sm">No emails in {activeMailbox}.</p></div>
              )}
              {!isLoading && emails.map((email) => (
                <EmailListItem key={email.id} email={email} isSelected={selectedEmail?.id === email.id} onSelect={handleSelectEmail} onAiReply={activeMailbox === 'inbox' ? handleAiReplyFromList : undefined} />
              ))}
              {nextPageToken && !isLoading && (
                <div className="p-3">
                  <Button id="gmail-load-more" variant="outline" className="w-full" onClick={handleLoadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? <Loader2 className="animate-spin" /> : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Reading pane */}
          <div className={cn('min-h-0 flex-col', isReading ? 'flex' : 'hidden md:flex')}>
            {!selectedEmail && !showCalendar && (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><MailOpen className="h-8 w-8 text-muted-foreground" /></span>
                <p className="mt-4 font-semibold">No conversation selected</p>
                <p className="mt-1 text-sm text-muted-foreground">Pick an email from the list to read and reply.</p>
              </div>
            )}

            {showCalendar && (
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <h2 className="text-lg font-semibold">Upcoming events</h2>
                <div className="mt-4 space-y-3">
                  {calendarEvents.map((event) => (
                    <div key={event.id} id={`gmail-event-${event.id}`} className="flex gap-4 rounded-xl border p-4">
                      <span className="w-1 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-semibold">{event.summary}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatEventTime(event.start)} – {formatEventTime(event.end)}</p>
                      </div>
                    </div>
                  ))}
                  {calendarEvents.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
                </div>
              </div>
            )}

            {selectedEmail && selectedSender && (
              <>
                <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
                  <Button id="gmail-back" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" aria-label="Close email" onClick={() => setSelectedEmail(null)}><ArrowLeft /></Button>
                  <div className="min-w-0 flex-1">
                    <AiReplyAssistant
                      senderName={selectedSender.name}
                      isBusy={isGenerating || activeIntentId !== null}
                      activeIntentId={activeIntentId}
                      isHighlighted={highlightAssistant}
                      onIntent={handleReplyIntent}
                      onGenerateOptions={handleGenerateReplies}
                      onCustomPrompt={() => setIsQuickReplyOpen(true)}
                    />
                  </div>
                  <Button id="gmail-delete" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive" aria-label="Delete email" title="Delete" onClick={handleDeleteEmail}><Trash2 /></Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="px-6 pb-6 pt-5">
                    <h2 className="text-xl font-semibold leading-snug">{selectedEmail.subject || '(no subject)'}</h2>
                    <div className="mt-5 flex items-start gap-3">
                      <SenderAvatar name={selectedSender.name} className="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm"><span className="font-semibold">{selectedSender.name}</span> <span className="text-muted-foreground">&lt;{selectedSender.address}&gt;</span></p>
                        <p className="truncate text-xs text-muted-foreground">to {selectedEmail.to || 'me'}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{formatEmailDate(selectedEmail.date, true)}</p>
                      </div>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{formatEmailDate(selectedEmail.date, true)}</span>
                    </div>

                    {selectedCode && <div className="mt-5"><VerificationCodeCard code={selectedCode} /></div>}

                    <div className="mt-6 sm:pl-[52px]"><EmailBodyFrame key={selectedEmail.id} html={selectedEmail.body} title={selectedEmail.subject || 'Email'} /></div>
                  </div>

                  {/* Composer */}
                  <form onSubmit={handleSendReply} className="mx-6 mb-6 rounded-2xl border bg-card shadow-sm focus-within:border-primary/40 focus-within:shadow-md">
                    <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm text-muted-foreground">
                      <Reply className="h-4 w-4" /> Reply to <span className="font-medium text-foreground">{selectedSender.name}</span>
                    </div>
                    <Textarea id="gmail-reply-body" placeholder="Write your reply…" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" minRows={3} />
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
                      <span className="text-xs text-muted-foreground"><Sparkles className="mr-1 inline h-3 w-3 text-primary" />AI drafts land here so you can edit before sending.</span>
                      <Button id="gmail-send" type="submit" className="rounded-full px-5" disabled={isSending || !replyBody.trim()}>
                        {isSending ? <Loader2 className="animate-spin" /> : <Send />} Send Reply
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </Card>
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
      
      <Dialog open={isQuickReplyOpen} onOpenChange={setIsQuickReplyOpen}>
        <DialogContent>
            <form onSubmit={handleQuickReply}>
                <DialogHeader>
                    <DialogTitle>Quick Reply with AI</DialogTitle>
                    <DialogDescription>
                        Give me a short instruction in any language, and I'll generate a suitable reply in English.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="quickReplyPrompt" className="sr-only">Quick Reply Prompt</Label>
                    <Textarea 
                        id="quickReplyPrompt"
                        value={quickReplyPrompt}
                        onChange={(e) => setQuickReplyPrompt(e.target.value)}
                        placeholder="Type your instruction here..."
                        className="min-h-[80px]"
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsQuickReplyOpen(false)} disabled={isGeneratingQuickReply}>Cancel</Button>
                    <Button type="submit" disabled={isGeneratingQuickReply || !quickReplyPrompt.trim()}>
                        {isGeneratingQuickReply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Reply
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
