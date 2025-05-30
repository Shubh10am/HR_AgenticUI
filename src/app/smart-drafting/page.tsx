
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Edit3, Save, XCircle, Send, Copy, FileText } from 'lucide-react';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NONE_TEAM_VALUE = "--none--";

export default function SmartDraftingPage() {
  const [prompt, setPrompt] = useState('');
  const [composerOriginalBody, setComposerOriginalBody] = useState('');
  const [composerEditableBody, setComposerEditableBody] = useState('');
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);
  const [isEditingComposerBody, setIsEditingComposerBody] = useState(false);
  const { toast } = useToast();

  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  
  const [promptGeneratedDrafts, setPromptGeneratedDrafts] = useState<string[]>([]);


  useEffect(() => {
    const draftFromAssistance = localStorage.getItem('selectedEmailDraftForSmartDrafting');
    if (draftFromAssistance) {
      setComposerOriginalBody(draftFromAssistance);
      setComposerEditableBody(draftFromAssistance);
      setIsEditingComposerBody(false); // Start in read-only mode for the composer
      setPromptGeneratedDrafts([]); // Clear any drafts generated on this page
      localStorage.removeItem('selectedEmailDraftForSmartDrafting');
      toast({
        title: "Draft Loaded",
        description: "Email body populated from Email Assistance. You can now edit and add recipients/subject.",
      });
    }
  }, []);

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
    setPromptGeneratedDrafts([]); // Clear previous prompt-generated drafts
    // Clear the main composer if generating new drafts from this page's prompt
    setComposerOriginalBody(''); 
    setComposerEditableBody('');
    setIsEditingComposerBody(false);
    
    try {
      const input: GenerateDraftEmailResponsesInput = { query: `Draft an email based on the following prompt: ${prompt}` };
      const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
      
      if (result.draftResponses && result.draftResponses.length > 0) {
        setPromptGeneratedDrafts(result.draftResponses);
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

  const handleUsePromptGeneratedDraft = (draftContent: string) => {
    setComposerOriginalBody(draftContent);
    setComposerEditableBody(draftContent);
    setIsEditingComposerBody(false); // Start in read-only mode for the composer
    setPromptGeneratedDrafts([]); // Clear the list of prompt-generated drafts as one is chosen
    toast({
      title: "Draft Loaded into Composer",
      description: "Selected draft is now in the email body.",
    });
  };

  const handleEditComposerBody = () => {
    setIsEditingComposerBody(true);
  };

  const handleSaveComposerBody = () => {
    setComposerOriginalBody(composerEditableBody); 
    setIsEditingComposerBody(false);
    toast({
      title: "Draft Saved",
      description: "Your changes to the email body have been saved.",
    });
  };

  const handleCancelEditComposerBody = () => {
    setComposerEditableBody(composerOriginalBody); 
    setIsEditingComposerBody(false);
  };

  const handleCopy = () => {
    if (!composerEditableBody && !composerOriginalBody) {
        toast({ title: "Nothing to Copy", description: "Generate or load a draft first.", variant: "destructive" });
        return;
    }
    const textToCopy = `Subject: ${subject}\n\nTo: ${selectedTeam && selectedTeam !== NONE_TEAM_VALUE ? selectedTeam : recipients || 'N/A'}\n\nBody:\n${isEditingComposerBody ? composerEditableBody : composerOriginalBody}`;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to Clipboard",
      description: "The email content (To, Subject, Body) has been copied.",
    });
  };

  const handleMockSend = () => {
    if (!recipients && (!selectedTeam || selectedTeam === NONE_TEAM_VALUE)) {
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
    if (!composerEditableBody.trim()) {
        toast({
        title: "Email Body Empty",
        description: "Please ensure the email body is not empty.",
        variant: "destructive",
      });
      return;
    }

    const finalRecipients = selectedTeam && selectedTeam !== NONE_TEAM_VALUE ? `Team: ${selectedTeam}` : recipients;
    console.log("Mock Send:", {
      to: finalRecipients,
      subject,
      body: composerEditableBody,
    });
    toast({
      title: "Email Sent (Mock)",
      description: `Email to ${finalRecipients} with subject "${subject}" has been "sent".`,
    });
  };

  const mainGridClasses = promptGeneratedDrafts.length > 0 ? "grid gap-6 lg:grid-cols-2" : "grid gap-6 lg:grid-cols-3";
  const composerColSpanClasses = promptGeneratedDrafts.length > 0 ? "lg:col-span-1 shadow-lg" : "lg:col-span-2 shadow-lg";


  return (
    <>
      <PageHeader
        title="Smart Email Drafting & Composer"
        description="Generate, compose, and (mock) send professional emails. Load drafts from Email Assistance or generate new ones below."
      />
      <div className={mainGridClasses}>
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Email Prompt</CardTitle>
              <CardDescription>Generate multiple email body options based on your keywords.</CardDescription>
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
                      <CardTitle className="text-base">Option {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto p-2 border rounded bg-background">{draft}</p>
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
                {(!composerOriginalBody && !composerEditableBody && !isGeneratingFromPrompt && promptGeneratedDrafts.length === 0) && (
                  <div className="mt-1 border rounded-md bg-muted min-h-[200px] flex items-center justify-center">
                    <p className="text-center text-muted-foreground p-4">
                        Email body will appear here. Load from Email Assistance, or generate options using the prompt on the left and select one.
                    </p>
                  </div>
                )}
                {(composerOriginalBody || composerEditableBody) && (
                    isEditingComposerBody ? (
                    <Textarea
                        id="emailBody"
                        value={composerEditableBody}
                        onChange={(e) => setComposerEditableBody(e.target.value)}
                        className="mt-1 min-h-[200px] text-sm bg-background"
                        placeholder="Your email content..."
                    />
                    ) : ( 
                    <div className="mt-1 min-h-[200px] p-3 text-sm whitespace-pre-wrap border rounded-md bg-secondary/50">
                        {composerEditableBody || composerOriginalBody}
                    </div>
                    )
                )}
            </div>

            {(composerOriginalBody || composerEditableBody) && (
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                {isEditingComposerBody ? (
                  <>
                    <Button size="sm" onClick={handleSaveComposerBody} variant="default">
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                    <Button size="sm" onClick={handleCancelEditComposerBody} variant="ghost">
                      <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleEditComposerBody} variant="outline" disabled={!composerOriginalBody && !composerEditableBody}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Body
                  </Button>
                )}
              </div>
            )}
            <Button onClick={handleMockSend} className="w-full mt-4" disabled={(!composerOriginalBody && !composerEditableBody) || isGeneratingFromPrompt}>
                <Send className="mr-2 h-4 w-4" /> Send Email (Mock)
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

