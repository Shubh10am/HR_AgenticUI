
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Send, Copy, FileText, AlertCircle } from 'lucide-react';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const NONE_TEAM_VALUE = "--none--";

interface EmailDraft {
  subject: string;
  body: string;
}

export default function SmartDraftingPage() {
  const [prompt, setPrompt] = useState('');
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // State for the composer
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // State for generated drafts
  const [promptGeneratedDrafts, setPromptGeneratedDrafts] = useState<EmailDraft[]>([]);


  useEffect(() => {
    // Check Google Auth status
    const checkAuthStatus = async () => {
        if (!token || token.startsWith('guest-')) {
            setIsGoogleAuthenticated(false);
            setIsAuthLoading(false);
            return;
        }
        try {
            const response = await fetch('/api/google-auth/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setIsGoogleAuthenticated(response.ok && data.isAuthenticated);
        } catch (error) {
            setIsGoogleAuthenticated(false);
        } finally {
            setIsAuthLoading(false);
        }
    };
    checkAuthStatus();
    
    const draftBodyFromAssistance = localStorage.getItem('selectedEmailDraftForSmartDrafting');
    if (draftBodyFromAssistance) {
      setComposerBody(draftBodyFromAssistance);
      setSubject(''); 
      setRecipients('');
      setPromptGeneratedDrafts([]); 
      localStorage.removeItem('selectedEmailDraftForSmartDrafting');
      toast({
        title: "Draft Body Loaded",
        description: "Email body populated from Email Assistance. Please add recipients and a subject.",
      });
    }
  }, [token, toast]);

  async function handleSubmitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter keywords or a prompt for the email.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingFromPrompt(true);
    setPromptGeneratedDrafts([]); 
    setComposerBody(''); 
    setSubject('');
    
    try {
      const userApiKey = localStorage.getItem('userApiKey');
      const input: GenerateDraftEmailResponsesInput = { 
        query: `Draft an email based on the following prompt: ${prompt}`, 
        apiKey: userApiKey,
        userId: user?.id,
        organizationId: user?.organizationId,
      };
      const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
      
      if (result.drafts && result.drafts.length > 0) {
        setPromptGeneratedDrafts(result.drafts);
      } else {
        toast({
          title: "No Drafts Generated",
          description: "The AI couldn't generate drafts for this prompt. Try rephrasing.",
        });
      }
    } catch (error) {
      console.error('Error generating email draft:', error);
       toast({
        title: "Error",
        description: "Failed to generate email draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFromPrompt(false);
    }
  }

  const handleUsePromptGeneratedDraft = (draft: EmailDraft) => {
    setSubject(draft.subject);
    setComposerBody(draft.body);
    setPromptGeneratedDrafts([]);
    toast({
      title: "Draft Loaded into Composer",
      description: "Selected draft is now ready to be edited and sent.",
    });
  };

  const handleCopy = () => {
    if (!composerBody.trim()) {
        toast({ title: "Nothing to Copy", description: "The email body is empty.", variant: "destructive" });
        return;
    }
    const textToCopy = `Subject: ${subject}\n\nTo: ${selectedTeam && selectedTeam !== NONE_TEAM_VALUE ? selectedTeam : recipients || 'N/A'}\n\nBody:\n${composerBody}`;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to Clipboard",
      description: "The email content has been copied.",
    });
  };

  const handleSend = async () => {
    const finalRecipients = selectedTeam && selectedTeam !== NONE_TEAM_VALUE ? selectedTeam : recipients;
    if (!finalRecipients) {
       toast({ title: "Recipient Missing", description: "Please enter recipients or select a team.", variant: "destructive" });
       return;
    }
     if (!subject.trim()) {
       toast({ title: "Subject Missing", description: "Please enter a subject for the email.", variant: "destructive" });
       return;
    }
    if (!composerBody.trim()) {
        toast({ title: "Email Body Empty", description: "Please ensure the email body is not empty.", variant: "destructive" });
        return;
    }

    setIsSending(true);
    try {
        const response = await fetch('/api/google/emails/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                to: finalRecipients,
                subject,
                message: composerBody,
            })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send email.');
        }
        toast({ title: 'Email Sent Successfully', description: `Your email to ${finalRecipients} has been sent.` });
        // Optionally clear the form
        setRecipients('');
        setSubject('');
        setComposerBody('');
        setSelectedTeam('');
    } catch (error: any) {
        toast({ title: 'Send Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsSending(false);
    }
  };

  const mainGridClasses = promptGeneratedDrafts.length > 0 ? "grid gap-6 lg:grid-cols-2" : "grid gap-6 lg:grid-cols-3";
  const composerColSpanClasses = promptGeneratedDrafts.length > 0 ? "lg:col-span-1 shadow-lg" : "lg:col-span-2 shadow-lg";


  return (
    <>
      <PageHeader
        title="Smart Email Drafting & Composer"
        description="Generate, compose, and send professional emails. Write manually or generate drafts with AI."
      />
      <div className={mainGridClasses}>
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Email Prompt</CardTitle>
              <CardDescription>Generate multiple email options with subjects based on your keywords.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPrompt} className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    Keywords/Prompt for New Email
                  </Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Company-wide holiday party announcement for next Friday at 7 PM...'"
                    className="mt-1 min-h-[150px]"
                    disabled={isGeneratingFromPrompt}
                  />
                </div>
                <Button type="submit" disabled={isGeneratingFromPrompt} className="w-full">
                  {isGeneratingFromPrompt ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate Email Options
                </Button>
              </form>
            </CardContent>
          </Card>

          {isGeneratingFromPrompt && promptGeneratedDrafts.length === 0 && (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Generating drafts...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {promptGeneratedDrafts.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Generated Options</CardTitle>
                <CardDescription>Select an option to load into the composer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {promptGeneratedDrafts.map((draft, index) => (
                  <Card key={index} className="bg-secondary/50">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base truncate" title={draft.subject}>Option {index + 1}: {draft.subject}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto p-2 border rounded bg-background">{draft.body}</p>
                      <Button size="sm" variant="outline" onClick={() => handleUsePromptGeneratedDraft(draft)} className="w-full mt-3">
                        <FileText className="mr-2 h-4 w-4" /> Use this Option
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className={composerColSpanClasses}>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>Review, edit, and send your email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isGoogleAuthenticated && !isAuthLoading && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Google Account Not Connected</AlertTitle>
                    <AlertDescription>
                        Sending emails is disabled. Please <Link href="/integrations" className="font-semibold underline">connect your Google account</Link> to enable this feature.
                    </AlertDescription>
                </Alert>
            )}
            <div>
              <Label htmlFor="recipients">To</Label>
              <Input 
                id="recipients" 
                value={recipients} 
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="e.g., employee@example.com, team@example.com"
                className="mt-1"
                disabled={!!selectedTeam && selectedTeam !== NONE_TEAM_VALUE} 
              />
            </div>
             <div>
              <Label htmlFor="sendToTeam">Or Send to Team</Label>
              <Select 
                value={selectedTeam} 
                onValueChange={(value) => {
                  setSelectedTeam(value);
                  if (value && value !== NONE_TEAM_VALUE) {
                    setRecipients(''); 
                  }
                }}
              >
                <SelectTrigger id="sendToTeam" className="mt-1">
                  <SelectValue placeholder="Select a team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_TEAM_VALUE}>None (Manual Recipients)</SelectItem>
                  <SelectItem value="all-employees@hrstreamline.ai">All Employees</SelectItem>
                  <SelectItem value="engineering@hrstreamline.ai">Engineering Team</SelectItem>
                  <SelectItem value="marketing@hrstreamline.ai">Marketing Team</SelectItem>
                  <SelectItem value="hr-dept@hrstreamline.ai">HR Department</SelectItem>
                </SelectContent>
              </Select>
              {selectedTeam && selectedTeam !== NONE_TEAM_VALUE && <p className="text-xs text-muted-foreground mt-1">Manual 'To' field disabled when a team is selected.</p>}
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Important Update: Company Holiday Party"
                className="mt-1"
              />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="emailBody">Body</Label>
                <Textarea
                    id="emailBody"
                    value={composerBody}
                    onChange={(e) => setComposerBody(e.target.value)}
                    className="mt-1 min-h-[200px] text-sm bg-background"
                    placeholder="Write your email content here, or generate options on the left..."
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Button onClick={handleSend} disabled={isGeneratingFromPrompt || isSending || !isGoogleAuthenticated || isAuthLoading}>
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                     Send Email
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Content
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
