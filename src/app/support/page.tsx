
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Send, PlusCircle, AlertTriangle } from 'lucide-react';
import type { TicketPriority, TicketStatus, ISupportTicket } from '@/models/SupportTicket';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function SupportPage() {
  // State for new ticket form
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for ticket history
  const [tickets, setTickets] = useState<ISupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { token, user } = useAuth();
  const isGuest = user?.organizationId === 'guest-org-id';

  const fetchTickets = useCallback(async () => {
    if (isGuest || !token) {
        setIsLoadingTickets(false);
        return;
    }
    setIsLoadingTickets(true);
    setError(null);
    try {
        const response = await fetch('/api/support/tickets', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch tickets.');
        }
        const data = await response.json();
        setTickets(data);
    } catch (e: any) {
        setError(e.message);
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsLoadingTickets(false);
    }
  }, [isGuest, token, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);


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
      fetchTickets(); // Refresh ticket list
    } catch (error: any) {
      toast({ title: 'Submission Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Closed':
      case 'Resolved':
        return 'default';
      default: return 'outline';
    }
  };

  return (
    <>
      <PageHeader
        title="Support Center"
        description="Raise support tickets and track their status."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Create Ticket Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Create a New Support Ticket</CardTitle>
            <CardDescription>Please provide as much detail as possible about your issue.</CardDescription>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Issue with AI Interviewer" required disabled={isSubmitting || isGuest}/>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(value: TicketPriority) => setPriority(value)} required disabled={isSubmitting || isGuest}>
                      <SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="description">Description of Issue</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please describe the problem you are facing..." className="min-h-[150px]" required disabled={isSubmitting || isGuest}/>
              </div>
               <Button type="submit" className="w-full" disabled={isSubmitting || isGuest}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Ticket
              </Button>
               {isGuest && <p className="text-xs text-center text-muted-foreground mt-2">You must be logged in to submit a ticket.</p>}
            </form>
          </CardContent>
        </Card>

        {/* Ticket History */}
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle>My Ticket History</CardTitle>
              <CardDescription>A list of support tickets you have submitted.</CardDescription>
          </CardHeader>
          <CardContent>
              {isGuest ? (
                   <div className="text-center py-10 text-muted-foreground">
                      <p>Please log in to view your support ticket history.</p>
                  </div>
              ) : isLoadingTickets ? (
                   <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2">Loading tickets...</p>
                  </div>
              ) : error ? (
                  <div className="flex flex-col items-center justify-center h-40 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                      <p className="mt-2 text-destructive font-semibold">Failed to load tickets</p>
                      <p className="text-sm text-destructive/80">{error}</p>
                  </div>
              ) : (
                  <div className="rounded-md border overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Subject</TableHead>
                                  <TableHead>Priority</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Last Updated</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                          {tickets.length === 0 ? (
                              <TableRow>
                                  <TableCell colSpan={4} className="h-24 text-center">
                                  You haven't submitted any support tickets yet.
                                  </TableCell>
                              </TableRow>
                          ) : (
                              tickets.map((ticket) => (
                                  <TableRow key={ticket._id}>
                                      <TableCell className="font-medium max-w-xs truncate">{ticket.subject}</TableCell>
                                      <TableCell>
                                          <Badge variant={ticket.priority === 'High' ? 'destructive' : ticket.priority === 'Medium' ? 'secondary' : 'outline'}>
                                              {ticket.priority}
                                          </Badge>
                                      </TableCell>
                                      <TableCell>
                                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                                              {ticket.status}
                                          </Badge>
                                      </TableCell>
                                      <TableCell>{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</TableCell>
                                  </TableRow>
                              ))
                          )}
                          </TableBody>
                      </Table>
                  </div>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
