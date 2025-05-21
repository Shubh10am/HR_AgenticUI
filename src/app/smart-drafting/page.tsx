
'use client';

import { useState, type FormEvent } from 'react';
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
    // Optionally clear previous subject/recipients when generating a new draft
    // setSubject(''); 
    // setRecipients('');
    // setSelectedTeam('');


    try {
      const input: GenerateDraftEmailResponsesInput = { query: `Draft an email based on the following prompt: ${prompt}` };
      const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
      
      if (result.draftResponses && result.draftResponses.length > 0) {
        const firstDraft = result.draftResponses[0];
        setOriginalDraft(firstDraft);
        setEditableDraft(firstDraft);
      } else {
        setOriginalDraft("The AI couldn't generate a draft for this prompt. Please try rephrasing or be more specific.");
        setEditableDraft("The AI couldn't generate a draft for this prompt. Please try rephrasing or be more specific.");
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
    const textToCopy = `Subject: ${subject}\n\nTo: ${recipients || selectedTeam || 'N/A'}\n\nBody:\n${isEditing ? editableDraft : originalDraft}`;
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
     if (!subject) {
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
    // Optionally clear fields after sending
    // setRecipients('');
    // setSubject('');
    // setSelectedTeam('');
    // setOriginalDraft('');
    // setEditableDraft('');
    // setPrompt('');
  };


  return (
    <>
      <PageHeader
        title="Smart Email Drafting"
        description="Generate, compose, and (mock) send professional emails."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle>Email Prompt</CardTitle>
            <CardDescription>Enter keywords or a detailed prompt to generate the email body.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-sm font-medium">
                  Keywords/Prompt for Email Body
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Company-wide holiday party announcement for next Friday at 7 PM...'"
                  className="mt-1 min-h-[150px]"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Email Body
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
                disabled={!!selectedTeam} 
              />
            </div>
             <div>
              <Label htmlFor="sendToTeam">Or Send to Team</Label>
              <Select value={selectedTeam} onValueChange={(value) => {setSelectedTeam(value); if(value) setRecipients('');}}>
                <SelectTrigger id="sendToTeam" className="mt-1">
                  <SelectValue placeholder="Select a team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Manual Recipients)</SelectItem>
                  <SelectItem value="all-employees@hrstreamline.ai">All Employees</SelectItem>
                  <SelectItem value="engineering@hrstreamline.ai">Engineering Team</SelectItem>
                  <SelectItem value="marketing@hrstreamline.ai">Marketing Team</SelectItem>
                  <SelectItem value="hr-dept@hrstreamline.ai">HR Department</SelectItem>
                </SelectContent>
              </Select>
              {selectedTeam && <p className="text-xs text-muted-foreground mt-1">Manual 'To' field disabled when a team is selected.</p>}
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
                {isLoading && !originalDraft && (
                  <div className="flex items-center justify-center py-8 mt-1 border rounded-md bg-muted min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Generating draft...</p>
                  </div>
                )}
                {!isLoading && !originalDraft && (
                  <div className="mt-1 border rounded-md bg-muted min-h-[200px] flex items-center justify-center">
                    <p className="text-center text-muted-foreground p-4">
                        Email body will appear here after generation. Enter a prompt and click "Generate Email Body".
                    </p>
                  </div>
                )}
                {originalDraft && (
                    isEditing ? (
                    <Textarea
                        id="emailBody"
                        value={editableDraft}
                        onChange={(e) => setEditableDraft(e.target.value)}
                        className="mt-1 min-h-[200px] text-sm bg-background"
                    />
                    ) : (
                    <div className="mt-1 min-h-[200px] p-3 text-sm whitespace-pre-wrap border rounded-md bg-secondary/50">
                        {editableDraft}
                    </div>
                    )
                )}
            </div>

            {originalDraft && (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} variant="default">
                      <Save className="mr-2 h-4 w-4" /> Save Draft
                    </Button>
                    <Button size="sm" onClick={handleCancelEdit} variant="ghost">
                      <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleEdit} variant="outline" disabled={!originalDraft}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Draft
                  </Button>
                )}
              </div>
            )}
            <Button onClick={handleMockSend} className="w-full mt-4" disabled={!originalDraft || isLoading}>
                <Send className="mr-2 h-4 w-4" /> Send Email (Mock)
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
