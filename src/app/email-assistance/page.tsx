'use client';

import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Send } from 'lucide-react';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';
import { useToast } from "@/hooks/use-toast";

export default function EmailAssistancePage() {
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      setDrafts(result.draftResponses || []);
      if (!result.draftResponses || result.draftResponses.length === 0) {
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

  return (
    <>
      <PageHeader
        title="AI-Powered Email Assistance"
        description="Generate draft responses for employee inquiries and requests."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
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

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Generated Draft Responses</CardTitle>
            <CardDescription>Review and select a draft to use.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Generating drafts...</p>
              </div>
            )}
            {!isLoading && drafts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No drafts generated yet. Enter a query and click "Generate Drafts".
              </p>
            )}
            {drafts.length > 0 && (
              <div className="space-y-4">
                {drafts.map((draft, index) => (
                  <Card key={index} className="bg-secondary/50">
                    <CardHeader>
                      <CardTitle className="text-base">Draft {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{draft}</p>
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="outline" size="sm">Copy</Button>
                        <Button size="sm">
                          <Send className="mr-2 h-4 w-4" />
                          Use this draft
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
