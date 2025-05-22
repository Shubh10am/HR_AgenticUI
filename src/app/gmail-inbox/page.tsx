
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wand2, Send, Reply, ChevronRight, ChevronLeft, MailOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { Badge } from '@/components/ui/badge';

interface MockEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  snippet: string;
}

const mockEmailsData: MockEmail[] = [
  {
    id: '1',
    sender: 'alice@example.com',
    recipient: 'admin@hrstreamline.ai',
    subject: 'Regarding my leave application',
    body: 'Hello HR Admin,\n\nI would like to follow up on my leave application submitted last week for the dates 20th July to 25th July. Could you please let me know the status?\n\nThanks,\nAlice',
    date: '2024-07-18 10:00 AM',
    read: false,
    snippet: 'Follow up on my leave application submitted last week...',
  },
  {
    id: '2',
    sender: 'bob.marketing@example.com',
    recipient: 'admin@hrstreamline.ai',
    subject: 'New Marketing Campaign Proposal',
    body: 'Hi Team,\n\nPlease find attached the proposal for our new Q4 marketing campaign. Looking forward to your feedback in the meeting next Monday.\n\nBest,\nBob',
    date: '2024-07-18 09:15 AM',
    read: true,
    snippet: 'Please find attached the proposal for our new Q4 marketing campaign...',
  },
  {
    id: '3',
    sender: 'charlie.dev@example.com',
    recipient: 'admin@hrstreamline.ai',
    subject: 'System Maintenance Notification',
    body: 'Dear All,\n\nThis is to inform you that there will be a scheduled system maintenance on Saturday, July 20th, from 2 AM to 4 AM. Services might be temporarily unavailable during this period.\n\nRegards,\nCharlie (IT Department)',
    date: '2024-07-17 03:30 PM',
    read: false,
    snippet: 'Scheduled system maintenance on Saturday, July 20th...',
  },
  {
    id: '4',
    sender: 'vendor.services@example.com',
    recipient: 'admin@hrstreamline.ai',
    subject: 'Invoice INV-2024-00123',
    body: 'Dear HR Streamline AI,\n\nAttached is invoice INV-2024-00123 for services rendered in June 2024. Please process the payment at your earliest convenience.\n\nThank you,\nVendor Services Team',
    date: '2024-07-16 11:00 AM',
    read: true,
    snippet: 'Attached is invoice INV-2024-00123 for services rendered...',
  },
];

export default function GmailInboxPage() {
  const [emails, setEmails] = useState<MockEmail[]>(mockEmailsData);
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [generatedReplyDrafts, setGeneratedReplyDrafts] = useState<string[]>([]);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  
  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const { toast } = useToast();

  const handleSelectEmail = (email: MockEmail) => {
    setSelectedEmail(email);
    setGeneratedReplyDrafts([]);
    setShowReplyComposer(false);
    setReplyBody(''); 
    setReplyTo('');
    setReplySubject('');
    // Mock marking email as read
    setEmails(prev => prev.map(e => e.id === email.id ? {...e, read: true} : e));
  };

  const handleGenerateAIReply = async () => {
    if (!selectedEmail) return;

    setIsGeneratingReply(true);
    setGeneratedReplyDrafts([]);
    try {
      const query = `The following email was received:
From: ${selectedEmail.sender}
Subject: ${selectedEmail.subject}
Body:
${selectedEmail.body}

Please generate a few professional reply options to this email.`;
      
      const input: GenerateDraftEmailResponsesInput = { query };
      const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
      
      if (result.draftResponses && result.draftResponses.length > 0) {
        setGeneratedReplyDrafts(result.draftResponses);
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
    setReplyTo(selectedEmail.sender);
    setReplySubject(`Re: ${selectedEmail.subject}`);
    setReplyBody(draft);
    setShowReplyComposer(true);
    setGeneratedReplyDrafts([]); // Clear drafts once one is selected
  };
  
  const handleManuallyComposeReply = () => {
    if (!selectedEmail) return;
    setReplyTo(selectedEmail.sender);
    setReplySubject(`Re: ${selectedEmail.subject}`);
    setReplyBody(''); // Start with empty body
    setShowReplyComposer(true);
    setGeneratedReplyDrafts([]);
  }

  const handleSendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replyTo || !replySubject || !replyBody) {
      toast({ title: "Incomplete Reply", description: "Please fill To, Subject, and Body.", variant: "destructive" });
      return;
    }
    setIsSendingReply(true);
    // Mock sending email
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Mock Sent Email:", { to: replyTo, subject: replySubject, body: replyBody });
    toast({
      title: "Reply Sent (Mock)",
      description: `Your reply to ${replyTo} has been "sent".`,
    });
    setIsSendingReply(false);
    setShowReplyComposer(false);
    setReplyBody('');
    // Optionally, clear selectedEmail or navigate away
    // setSelectedEmail(null); 
  };

  return (
    <>
      <PageHeader
        title="Gmail Inbox"
        description="Fetch, read, and reply to your emails with AI assistance (Mock Interface)."
      >
        <Button variant="outline" onClick={() => alert("Mock: Refreshing emails...")}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
        {/* Email List */}
        <Card className="md:col-span-1 shadow-lg flex flex-col h-full">
          <CardHeader>
            <CardTitle>Inbox ({emails.filter(e => !e.read).length} unread)</CardTitle>
            <CardDescription>Showing {emails.length} mock emails.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {emails.map((email) => (
                  <Card 
                    key={email.id} 
                    className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedEmail?.id === email.id ? 'bg-secondary' : 'bg-card'} ${!email.read ? 'border-primary border-2' : 'border'}`}
                    onClick={() => handleSelectEmail(email)}
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-semibold ${!email.read ? 'text-primary' : 'text-foreground'}`}>{email.sender}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className={`text-sm truncate ${!email.read ? 'font-bold' : ''}`}>{email.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                    <p className="text-xs text-muted-foreground mt-1">{email.date}</p>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Email Detail & Reply Section */}
        <Card className="md:col-span-2 shadow-lg flex flex-col h-full">
          {!selectedEmail ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
              <MailOpen className="h-24 w-24 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">Select an email to read</p>
              <p className="text-sm text-muted-foreground">Its content and reply options will appear here.</p>
            </div>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-xl">{selectedEmail.subject}</CardTitle>
                <div className="flex justify-between items-center">
                    <CardDescription>From: {selectedEmail.sender}</CardDescription>
                    <CardDescription>To: {selectedEmail.recipient}</CardDescription>
                </div>
                <CardDescription>Date: {selectedEmail.date}</CardDescription>
              </CardHeader>
              <ScrollArea className="flex-grow p-0">
                <CardContent className="whitespace-pre-wrap text-sm p-6 border-t border-b">
                    {selectedEmail.body}
                </CardContent>
              </ScrollArea>
              
              {/* AI Reply Drafts or Composer */}
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
                        <p className="text-xs whitespace-pre-wrap max-h-28 overflow-y-auto mb-2 p-2 border rounded bg-card">{draft}</p>
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
                      <Input id="replyTo" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} readOnly className="bg-muted"/>
                    </div>
                    <div>
                      <Label htmlFor="replySubject">Subject:</Label>
                      <Input id="replySubject" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} className="bg-muted"/>
                    </div>
                    <div>
                      <Label htmlFor="replyBody">Body:</Label>
                      <Textarea
                        id="replyBody"
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write your reply..."
                        className="min-h-[150px]"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={isSendingReply} className="flex-1">
                          {isSendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          Send Reply (Mock)
                        </Button>
                        <Button variant="outline" onClick={() => setShowReplyComposer(false)} disabled={isSendingReply} className="flex-1">
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
