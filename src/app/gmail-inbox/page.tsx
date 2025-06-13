'use client';

import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Send, Reply, ChevronRight, MailOpen, RefreshCw, Trash2, FileWarning, LinkIcon, Calendar, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';

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
  const [categoryEmails, setCategoryEmails] = useState<Email[]>([]);
  const [spamEmails, setSpamEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeSection, setActiveSection] = useState('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [generatedReplyDrafts, setGeneratedReplyDrafts] = useState<string[]>([]);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const { toast } = useToast();

  const API_BASE_URL = 'http://localhost:8000';

  // Clean up email body for display (remove excessive newlines, style links)
  const formatEmailBody = (body: string) => {
    // Remove excessive newlines and trim
    const cleanedBody = body.replace(/\r\n\s*\r\n/g, '\n\n').trim();
    
    // Split the body into lines for processing
    const lines = cleanedBody.split('\n');
    const formattedLines: JSX.Element[] = [];
    let inFooter = false;

    lines.forEach((line, index) => {
      // Detect footer sections (e.g., "Unsubscribe", "Help", "©")
      if (line.includes('Unsubscribe') || line.includes('Help') || line.includes('©') || line.includes('This email was intended for')) {
        inFooter = true;
      }

      if (inFooter) {
        // Style footer links (e.g., Unsubscribe, Help)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = line.split(urlRegex);
        const formattedLine = parts.map((part, i) => {
          if (part.match(urlRegex)) {
            return (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {part.includes('unsubscribe') ? 'Unsubscribe' : part.includes('help') ? 'Help' : part}
              </a>
            );
          }
          return part;
        });

        formattedLines.push(
          <p key={index} className="text-xs text-muted-foreground italic">
            {formattedLine}
          </p>
        );
      } else {
        // Handle repeated headers (e.g., in Wipro email)
        if (index === 0 && line === lines[1]) {
          return; // Skip repeated header
        }
        // Normal body content
        formattedLines.push(
          <p key={index} className="text-sm leading-relaxed">
            {line}
          </p>
        );
      }
    });

    return formattedLines;
  };

  // Check authentication status and handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === 'true') {
      setIsAuthenticated(true);
      toast({ title: "Authentication Successful", description: "Connected to Google account." });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (isAuthenticated) {
      fetchEmails();
      fetchCategoryEmails();
      fetchSpamEmails();
      fetchSentEmails();
      fetchCalendarEvents();
    }
  }, [isAuthenticated]);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/emails`, { params: { limit: 10 } });
      setEmails(response.data);
    } catch (error) {
      toast({
        title: "Error Fetching Emails",
        description: "Failed to fetch emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryEmails = async (category?: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/emails/categories`, { params: { category, limit: 10 } });
      setCategoryEmails(response.data);
    } catch (error) {
      toast({
        title: "Error Fetching Category Emails",
        description: "Failed to fetch category emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpamEmails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/emails/spam`, { params: { limit: 10 } });
      setSpamEmails(response.data);
    } catch (error) {
      toast({
        title: "Error Fetching Spam Emails",
        description: "Failed to fetch spam emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSentEmails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/emails/sent`, { params: { limit: 10, days_ago: 5 } });
      setSentEmails(response.data);
    } catch (error) {
      toast({
        title: "Error Fetching Sent Emails",
        description: "Failed to fetch sent emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/events`, {
        calendar_id: 'primary',
        max_results: 10,
      });
      setCalendarEvents(response.data);
    } catch (error) {
      toast({
        title: "Error Fetching Calendar Events",
        description: "Failed to fetch calendar events. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmail = async (messageId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/email/delete/${messageId}`);
      if (activeSection === 'inbox') {
        setEmails(emails.filter(email => email.id !== messageId));
      } else if (activeSection === 'spam') {
        setSpamEmails(spamEmails.filter(email => email.id !== messageId));
      } else if (activeSection === 'sent') {
        setSentEmails(sentEmails.filter(email => email.id !== messageId));
      } else {
        setCategoryEmails(categoryEmails.filter(email => email.id !== messageId));
      }
      if (selectedEmail?.id === messageId) {
        setSelectedEmail(null);
      }
      toast({ title: "Email Deleted", description: "The email has been deleted." });
    } catch (error) {
      toast({
        title: "Error Deleting Email",
        description: "Failed to delete email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnectGoogleAccount = () => {
    try{
      // window.location.href = `${API_BASE_URL}/auth/login`;
      toast({
        title: "Connecting Google Account",
        description: "Backend Deployment is Unstable Redirecting to Google authentication...",
      });
    } catch (error) {
      console.error('Error connecting Google account:', error);
      toast({
        title: "Error Connecting",
        description: "Failed to connect Google account Due to Backend Stable Deployment. We are working on it.",
        variant: "destructive",
      });
    }
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setShowCalendar(false);
    setGeneratedReplyDrafts([]);
    setShowReplyComposer(false);
    setReplyBody('');
    setReplyTo('');
    setReplySubject('');
  };

  const handleSelectCalendarView = () => {
    setSelectedEmail(null);
    setShowCalendar(true);
    setGeneratedReplyDrafts([]);
    setShowReplyComposer(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchEmails(),
        fetchCategoryEmails(),
        fetchSpamEmails(),
        fetchSentEmails(),
        fetchCalendarEvents(),
      ]);
      toast({ title: "Refreshed", description: "Emails and calendar events updated." });
    } catch (error) {
      toast({
        title: "Error Refreshing",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateAIReply = async () => {
    if (!selectedEmail) return;

    setIsGeneratingReply(true);
    setGeneratedReplyDrafts([]);
    try {
      const query = `The following email was received:
From: ${selectedEmail.from}
Subject: ${selectedEmail.subject}
Body:
${selectedEmail.body}

Please generate a few professional reply options to this email.`;
      
      const input: GenerateDraftEmailResponsesInput = { query };
      const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
      
      if (result.drafts && result.drafts.length > 0) {
        setGeneratedReplyDrafts(result.drafts.map(d => d.body));
      } else {
        toast({
          title: "No Reply Drafts Generated",
          description: "The AI couldn't generate replies for this email. Try again or manually compose.",
        });
      }
    } catch (error) {
      console.error('Error generating AI reply:', error);
      toast({
        title: "Error Generating Reply",
        description: "Failed to generate AI reply drafts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleUseDraftForReply = (draft: string) => {
    if (!selectedEmail) return;
    setReplyTo(selectedEmail.from);
    setReplySubject(`Re: ${selectedEmail.subject}`);
    setReplyBody(draft);
    setShowReplyComposer(true);
    setGeneratedReplyDrafts([]);
  };

  const handleManuallyComposeReply = () => {
    if (!selectedEmail) return;
    setReplyTo(selectedEmail.from);
    setReplySubject(`Re: ${selectedEmail.subject}`);
    setReplyBody('');
    setShowReplyComposer(true);
    setGeneratedReplyDrafts([]);
  };

  const handleSendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyTo || !replySubject || !replyBody || !selectedEmail) {
      toast({ title: "Incomplete Reply", description: "Please fill To, Subject, and Body.", variant: "destructive" });
      return;
    }
    setIsSendingReply(true);
    try {
      await axios.post(`${API_BASE_URL}/email/reply`, {
        message_id: selectedEmail.id,
        to: replyTo,
        subject: replySubject,
        message: replyBody,
        thread_id: selectedEmail.threadId,
      });
      toast({ title: "Reply Sent", description: `Your reply to ${replyTo} has been sent.` });
      setShowReplyComposer(false);
      setReplyBody('');
      fetchEmails();
      fetchCategoryEmails();
      fetchSpamEmails();
      fetchSentEmails();
    } catch (error) {
      toast({
        title: "Error Sending Reply",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSectionChange = (value: string) => {
    setActiveSection(value);
    setSelectedCategory(null);
    setSelectedEmail(null);
    if (value === 'inbox') fetchEmails();
    else if (value === 'spam') fetchSpamEmails();
    else if (value === 'sent') fetchSentEmails();
    else if (value === 'categories') fetchCategoryEmails();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    fetchCategoryEmails(value);
  };

  const mainGridClasses = "grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-6rem)]";
  const detailCardClasses = "md:col-span-2 shadow-lg flex flex-col h-full min-h-0";

  return (
    <>
      <PageHeader
        title="Gmail & Calendar"
        description="Manage your emails and calendar events with AI assistance."
        className="mb-4"
      >
        {!isAuthenticated && (
          <Button variant="outline" onClick={handleConnectGoogleAccount} className="mr-2">
            <LinkIcon className="mr-2 h-4 w-4" />
            Connect Google Account
          </Button>
        )}
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || !isAuthenticated}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </PageHeader>

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
                <div className="space-y-3">
                  <Select onValueChange={handleSectionChange} defaultValue="inbox">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbox">Inbox</SelectItem>
                      <SelectItem value="categories">Categories</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                  {activeSection === 'categories' && (
                    <Select onValueChange={handleCategoryChange} value={selectedCategory || ''}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="updates">Updates</SelectItem>
                        <SelectItem value="forums">Forums</SelectItem>
                        <SelectItem value="promotions">Promotions</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  {isLoading && (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    </div>
                  )}
                  {!isAuthenticated && (
                    <div className="text-center text-muted-foreground p-6">
                      <FileWarning className="h-12 w-12 mx-auto mb-2" />
                      <p>Please connect your Google account to view emails.</p>
                    </div>
                  )}
                  {isAuthenticated && activeSection === 'inbox' && emails.map((email) => (
                    <Card
                      key={email.id}
                      className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedEmail?.id === email.id ? 'bg-secondary' : 'bg-card'} mb-2`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      <div className="flex justify-between items-start w-full gap-2">
                        <p className="text-sm font-semibold line-clamp-1 min-w-0">{email.from}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-sm line-clamp-1">{email.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                      <p className="text-xs text-muted-foreground mt-1">{email.date}</p>
                    </Card>
                  ))}
                  {isAuthenticated && activeSection === 'categories' && categoryEmails.map((email) => (
                    <Card
                      key={email.id}
                      className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedEmail?.id === email.id ? 'bg-secondary' : 'bg-card'} mb-2`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      <div className="flex justify-between items-start w-full gap-2">
                        <p className="text-sm font-semibold line-clamp-1 min-w-0">{email.from}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-sm line-clamp-1">{email.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                      <p className="text-xs text-muted-foreground mt-1">{email.date}</p>
                      <p className="text-xs text-muted-foreground">Category: {email.category}</p>
                    </Card>
                  ))}
                  {isAuthenticated && activeSection === 'spam' && spamEmails.map((email) => (
                    <Card
                      key={email.id}
                      className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedEmail?.id === email.id ? 'bg-secondary' : 'bg-card'} mb-2`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      <div className="flex justify-between items-start w-full gap-2">
                        <p className="text-sm font-semibold line-clamp-1 min-w-0">{email.from}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-sm line-clamp-1">{email.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                      <p className="text-xs text-muted-foreground mt-1">{email.date}</p>
                    </Card>
                  ))}
                  {isAuthenticated && activeSection === 'sent' && sentEmails.map((email) => (
                    <Card
                      key={email.id}
                      className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedEmail?.id === email.id ? 'bg-secondary' : 'bg-card'} mb-2`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      <div className="flex justify-between items-start w-full gap-2">
                        <p className="text-sm font-semibold line-clamp-1 min-w-0">To: {email.to}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-sm line-clamp-1">{email.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                      <p className="text-xs text-muted-foreground mt-1">{email.date}</p>
                    </Card>
                  ))}
                  {isAuthenticated && activeSection === 'inbox' && emails.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground p-6">
                      <FileWarning className="h-12 w-12 mx-auto mb-2" />
                      <p>No emails to display.</p>
                      <p className="text-xs">Try refreshing or check your connection.</p>
                    </div>
                  )}
                  {isAuthenticated && activeSection === 'categories' && categoryEmails.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground p-6">
                      <FileWarning className="h-12 w-12 mx-auto mb-2" />
                      <p>No category emails to display.</p>
                    </div>
                  )}
                  {isAuthenticated && activeSection === 'spam' && spamEmails.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground p-6">
                      <FileWarning className="h-12 w-12 mx-auto mb-2" />
                      <p>No spam emails to display.</p>
                    </div>
                  )}
                  {isAuthenticated && activeSection === 'sent' && sentEmails.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground p-6">
                      <FileWarning className="h-12 w-12 mx-auto mb-2" />
                      <p>No sent emails to display.</p>
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
              <p className="text-sm text-muted-foreground">Content will appear here.</p>
            </div>
          ) : showCalendar ? (
            <>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Calendar Events</CardTitle>
                <CardDescription>Upcoming events from your primary calendar.</CardDescription>
              </CardHeader>
              <ScrollArea className="flex-grow p-0 min-h-0">
                <CardContent className="p-4 space-y-4">
                  {calendarEvents.map((event) => (
                    <Card key={event.id} className="p-3">
                      <p className="text-sm font-semibold">{event.summary}</p>
                      <p className="text-xs text-muted-foreground">Start: {new Date(event.start).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">End: {new Date(event.end).toLocaleString()}</p>
                      {event.location && <p className="text-xs text-muted-foreground">Location: {event.location}</p>}
                      {event.description && <p className="text-xs whitespace-pre-wrap">{event.description}</p>}
                      {event.attendees.length > 0 && (
                        <p className="text-xs text-muted-foreground">Attendees: {event.attendees.map(a => a.email).join(', ')}</p>
                      )}
                    </Card>
                  ))}
                  {calendarEvents.length === 0 && (
                    <p className="text-center text-muted-foreground">No upcoming events.</p>
                  )}
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
                <CardDescription>Date: {selectedEmail.date}</CardDescription>
              </CardHeader>
              <CardContent className="border-t border-b p-4 flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEmail(selectedEmail.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardContent>
              <ScrollArea className="flex-grow p-0 min-h-0">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">{formatEmailBody(selectedEmail.body)}</div>
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Attachments:</p>
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <p className="text-sm line-clamp-1">{attachment.filename || 'noname'}</p>
                          <p className="text-xs text-muted-foreground">({(attachment.size / 1024).toFixed(2)} KB)</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </ScrollArea>
              <div className="p-4 space-y-4 border-t bg-background">
                {!showReplyComposer && generatedReplyDrafts.length === 0 && (
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateAIReply} disabled={isGeneratingReply} className="flex-1">
                      {isGeneratingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      Generate AI Reply Options
                    </Button>
                    <Button onClick={handleManuallyComposeReply} variant="outline" className="flex-1">
                      <Reply className="mr-2 h-4 w-4" /> Manually Compose Reply
                    </Button>
                  </div>
                )}
                {isGeneratingReply && generatedReplyDrafts.length === 0 && (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Generating AI reply drafts...</p>
                  </div>
                )}
                {!showReplyComposer && generatedReplyDrafts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold">Suggested AI Replies:</h4>
                    {generatedReplyDrafts.map((draft, index) => (
                      <Card key={index} className="bg-secondary/50 p-3">
                        <p className="text-xs break-words max-h-28 overflow-y-auto mb-2 p-2 border rounded bg-card">{draft}</p>
                        <Button size="sm" onClick={() => handleUseDraftForReply(draft)} className="w-full">
                          Use this Draft for Reply
                        </Button>
                      </Card>
                    ))}
                    <Button onClick={handleManuallyComposeReply} variant="outline" className="w-full">
                      Or Manually Compose Reply
                    </Button>
                  </div>
                )}
                {showReplyComposer && (
                  <form onSubmit={handleSendReply} className="space-y-3">
                    <h3 className="text-lg font-semibold">Compose Reply</h3>
                    <div>
                      <Label htmlFor="replyTo">To:</Label>
                      <Input id="replyTo" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} readOnly className="bg-muted border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200" />
                    </div>
                    <div>
                      <Label htmlFor="replySubject">Subject:</Label>
                      <Input id="replySubject" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} className="bg-muted border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200" />
                    </div>
                    <div>
                      <Label htmlFor="replyBody">Body:</Label>
                      <Textarea
                        id="replyBody"
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write your reply..."
                        className="min-h-[150px] border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSendingReply} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                        {isSendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Reply
                      </Button>
                      <Button variant="outline" onClick={() => setShowReplyComposer(false)} disabled={isSendingReply} className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100">
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}