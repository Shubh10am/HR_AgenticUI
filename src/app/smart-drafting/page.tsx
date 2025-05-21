
'use client';

import { useState, type FormEvent, useEffect } from 'react'; // Added useEffect
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Edit3, Save, XCircle, Send, Copy } from 'lucide-react';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NONE_TEAM_VALUE = "--none--";

export default function SmartDraftingPage() {
  const [prompt, setPrompt] = useState('');
  const [originalDraft, setOriginalDraft] = useState('');
  const [editableDraft, setEditableDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    const draftFromAssistance = localStorage.getItem('selectedEmailDraftForSmartDrafting');
    if (draftFromAssistance) {
      setOriginalDraft(draftFromAssistance);
      setEditableDraft(draftFromAssistance);
      // setPrompt(''); // Optional: Clear prompt if draft is loaded
      localStorage.removeItem('selectedEmailDraftForSmartDrafting');
      toast({
        title: "Draft Loaded",
        description: "Email body populated from Email Assistance. You can now edit and add recipients/subject.",
      });
    }
  }, []); // Empty dependency array: runs once on mount

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
    setIsLoading(true);
    setOriginalDraft('');
    setEditableDraft('');
    setIsEditing(false);
    
    try {
      const input: GenerateDraftEmailResponsesInput = { query: `Draft an email based on the following prompt: ${prompt}` };
      const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
      
      if (result.draftResponses && result.draftResponses.length > 0) {
        const firstDraft = result.draftResponses[0];
        setOriginalDraft(firstDraft);
        setEditableDraft(firstDraft);
      } else {
        const fallbackMessage = "The AI couldn't generate a draft for this prompt. Please try rephrasing or be more specific.";
        setOriginalDraft(fallbackMessage);
        setEditableDraft(fallbackMessage);
        toast({
          title: "No Draft Generated",
          description: "The AI couldn't generate a draft for this prompt. Try rephrasing.",
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
      setIsLoading(false);
    }
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setOriginalDraft(editableDraft); 
    setIsEditing(false);
    toast({
      title: "Draft Saved",
      description: "Your changes to the draft have been saved locally.",
    });
  };

  const handleCancelEdit = () => {
    setEditableDraft(originalDraft); 
    setIsEditing(false);
  };

  const handleCopy = () => {
    if (!editableDraft && !originalDraft) {
        toast({ title: "Nothing to Copy", description: "Generate or load a draft first.", variant: "destructive" });
        return;
    }
    const textToCopy = `Subject: ${subject}\n\nTo: ${selectedTeam || recipients || 'N/A'}\n\nBody:\n${isEditing ? editableDraft : originalDraft}`;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to Clipboard",
      description: "The email content (To, Subject, Body) has been copied.",
    });
  };

  const handleMockSend = () => {
    if (!recipients && !selectedTeam) {
       toast({
        title: "Recipient Missing",
        description: "Please enter recipients or select a team.",
        variant: "destructive",
      });
      return;
    }
     if (!subject.trim()) {
       toast({
        title: "Subject Missing",
        description: "Please enter a subject for the email.",
        variant: "destructive",
      });
      return;
    }
    if (!editableDraft.trim()) {
        toast({
        title: "Email Body Empty",
        description: "Please ensure the email body is not empty.",
        variant: "destructive",
      });
      return;
    }

    const finalRecipients = selectedTeam ? `Team: ${selectedTeam}` : recipients;
    console.log("Mock Send:", {
      to: finalRecipients,
      subject,
      body: editableDraft,
    });
    toast({
      title: "Email Sent (Mock)",
      description: `Email to ${finalRecipients} with subject "${subject}" has been "sent".`,
    });
  };


  return (
    <>
      <PageHeader
        title="Smart Email Drafting & Composer"
        description="Generate, compose, and (mock) send professional emails. Optionally load a draft from Email Assistance."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle>Email Prompt (Optional)</CardTitle>
            <CardDescription>Use this to generate a new email body directly on this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-sm font-medium">
                  Keywords/Prompt for New Email Body
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Company-wide holiday party announcement for next Friday at 7 PM...'"
                  className="mt-1 min-h-[150px]"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate New Email Body
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>Review, edit, and prepare your email for sending.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            
            <div>
                <Label htmlFor="emailBody">Body</Label>
                {isLoading && !originalDraft && ( // Show loader only if loading and no draft yet
                  <div className="flex items-center justify-center py-8 mt-1 border rounded-md bg-muted min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Generating draft...</p>
                  </div>
                )}
                {!isLoading && !originalDraft && ( // No draft and not loading
                  <div className="mt-1 border rounded-md bg-muted min-h-[200px] flex items-center justify-center">
                    <p className="text-center text-muted-foreground p-4">
                        Email body will appear here after generation or if loaded from Email Assistance.
                    </p>
                  </div>
                )}
                {originalDraft && ( // If there is an original draft (loaded or generated)
                    isEditing || !editableDraft ? ( // Show textarea if editing OR if editableDraft isn't set (e.g. initial load)
                    <Textarea
                        id="emailBody"
                        value={editableDraft}
                        onChange={(e) => setEditableDraft(e.target.value)}
                        className="mt-1 min-h-[200px] text-sm bg-background"
                        placeholder="Your email content will appear here..."
                    />
                    ) : ( // Show read-only view
                    <div className="mt-1 min-h-[200px] p-3 text-sm whitespace-pre-wrap border rounded-md bg-secondary/50">
                        {editableDraft}
                    </div>
                    )
                )}
            </div>

            {(originalDraft || editableDraft) && ( // Show buttons if there's any draft content
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} variant="default">
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                    <Button size="sm" onClick={handleCancelEdit} variant="ghost">
                      <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleEdit} variant="outline" disabled={!originalDraft && !editableDraft}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Body
                  </Button>
                )}
              </div>
            )}
            <Button onClick={handleMockSend} className="w-full mt-4" disabled={(!originalDraft && !editableDraft) || isLoading}>
                <Send className="mr-2 h-4 w-4" /> Send Email (Mock)
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
