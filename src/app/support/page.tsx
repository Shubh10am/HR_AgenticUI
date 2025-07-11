'use client';

import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Send } from 'lucide-react';
import type { TicketPriority, TicketStatus } from '@/models/SupportTicket';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { token, user } = useAuth();
  const isGuest = user?.organizationId === 'guest-org-id';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isGuest) {
      toast({ title: 'Feature Unavailable', description: 'Please register to raise support tickets.', variant: 'destructive' });
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast({ title: 'Missing Information', description: 'Please fill out all required fields.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, description, priority }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit ticket.');
      }

      toast({
        title: 'Support Ticket Raised',
        description: 'Our team will get back to you shortly. Thank you!',
      });
      // Reset form
      setSubject('');
      setDescription('');
      setPriority('Medium');
    } catch (error: any) {
      toast({ title: 'Submission Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Get Support"
        description="Have a question or need help? Submit a support ticket and our team will assist you."
      />
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Create a New Support Ticket</CardTitle>
            <CardDescription>Please provide as much detail as possible about your issue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Issue with AI Interviewer"
                  required
                  disabled={isSubmitting || isGuest}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value: TicketPriority) => setPriority(value)}
                  required
                  disabled={isSubmitting || isGuest}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description of Issue</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the problem you are facing..."
                  className="min-h-[150px]"
                  required
                  disabled={isSubmitting || isGuest}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || isGuest}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Ticket
              </Button>
              {isGuest && (
                 <p className="text-sm text-center text-muted-foreground pt-2">
                    Raising support tickets is disabled in guest mode.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
