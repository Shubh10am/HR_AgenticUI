
'use client';

import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Send, Edit3 } from 'lucide-react'; // Added Edit3 for clarity
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation'; // Import useRouter

interface EmailDraft {
  subject: string;
  body: string;
}

export default function EmailAssistancePage() {
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter an employee inquiry or request.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setDrafts([]);

    try {
      const input: GenerateDraftEmailResponsesInput = { query };
      const result: GenerateDraftEmailResponsesOutput = await generateDraftEmailResponses(input);
      setDrafts(result.drafts || []); // Corrected: draftResponses -> drafts
      if (!result.drafts || result.drafts.length === 0) { // Corrected: draftResponses -> drafts
        toast({
          title: "No Drafts Generated",
          description: "The AI couldn't generate drafts for this query. Try rephrasing.",
        });
      }
    } catch (error) {
      console.error('Error generating email drafts:', error);
      toast({
        title: "Error",
        description: "Failed to generate email drafts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleUseDraft = (draft: EmailDraft) => { // Updated to accept EmailDraft
    localStorage.setItem('selectedEmailDraftForSmartDrafting', draft.body); // Still sending only body for now
    // If you want to send subject too, you might stringify an object:
    // localStorage.setItem('selectedEmailDraftForSmartDrafting', JSON.stringify(draft));
    // And then parse it in smart-drafting page. For now, keeping it simple.
    toast({
      title: "Draft Selected",
      description: "Redirecting to Smart Drafting page with the selected draft body...",
    });
    router.push('/smart-drafting');
  };

  return (
    <>
      <PageHeader
        title="AI-Powered Email Assistance"
        description="Generate draft responses for employee inquiries and requests."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Employee Query</CardTitle>
            <CardDescription>Enter the employee's message below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="query" className="text-sm font-medium">
                  Inquiry/Request
                </Label>
                <Textarea
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 'I would like to request a leave for next Monday...'"
                  className="mt-1 min-h-[150px]"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Drafts
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Generated Draft Responses</CardTitle>
            <CardDescription>Review and select a draft to use or compose new.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Generating drafts...</p>
              </div>
            )}
            {!isLoading && drafts.length === 0 && (
              <div className="text-center text-muted-foreground py-8 space-y-2">
                <p>
                  No drafts generated yet. Enter a query and click "Generate Drafts".
                </p>
                <Button onClick={() => router.push('/smart-drafting')} variant="outline">
                  <Edit3 className="mr-2 h-4 w-4" /> Go to Smart Drafting
                </Button>
              </div>
            )}
            {drafts.length > 0 && (
              <div className="space-y-4">
                {drafts.map((draft, index) => (
                  <Card key={index} className="bg-secondary/50">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-base truncate" title={draft.subject}>Draft {index + 1}: {draft.subject}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap max-h-60 overflow-y-auto p-2 border rounded-md bg-background">{draft.body}</p>
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleUseDraft(draft)}>
                          <Send className="mr-2 h-4 w-4" />
                          Use this draft in Composer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
