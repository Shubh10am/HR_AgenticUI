
'use client';

import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Edit3, Save, XCircle } from 'lucide-react';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { useToast } from "@/hooks/use-toast";

export default function SmartDraftingPage() {
  const [prompt, setPrompt] = useState('');
  const [originalDraft, setOriginalDraft] = useState('');
  const [editableDraft, setEditableDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    setOriginalDraft(editableDraft); // Save changes to be the new "original" for further edits
    setIsEditing(false);
    toast({
      title: "Draft Saved",
      description: "Your changes to the draft have been saved.",
    });
  };

  const handleCancelEdit = () => {
    setEditableDraft(originalDraft); // Revert to last saved/generated draft
    setIsEditing(false);
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? editableDraft : originalDraft;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to Clipboard",
      description: "The draft content has been copied.",
    });
  };

  return (
    <>
      <PageHeader
        title="Smart Email Drafting"
        description="Generate professional email drafts using AI-assisted prompts."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle>Email Prompt</CardTitle>
            <CardDescription>Enter keywords or a detailed prompt.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-sm font-medium">
                  Keywords/Prompt
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
                Generate Email Draft
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Generated Email Draft</CardTitle>
            <CardDescription>Review and edit the AI-generated email draft below.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Generating draft...</p>
              </div>
            )}
            {!isLoading && !originalDraft && (
              <p className="text-center text-muted-foreground py-8">
                No draft generated yet. Enter a prompt and click "Generate Email Draft".
              </p>
            )}
            {originalDraft && (
              <div className="p-4 border rounded-md bg-secondary/30">
                {isEditing ? (
                  <Textarea
                    value={editableDraft}
                    onChange={(e) => setEditableDraft(e.target.value)}
                    className="min-h-[200px] text-sm bg-background"
                  />
                ) : (
                  <pre className="text-sm whitespace-pre-wrap min-h-[200px] p-2 bg-background rounded-md">{originalDraft}</pre>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>Copy</Button>
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
                    <Button size="sm" onClick={handleEdit}>
                      <Edit3 className="mr-2 h-4 w-4" /> Edit &amp; Send
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
