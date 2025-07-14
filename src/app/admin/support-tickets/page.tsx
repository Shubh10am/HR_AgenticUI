
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Filter, Loader2, AlertTriangle, MessageSquare, User, Building, Calendar, Edit, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type TicketStatus = 'Open' | 'In Progress' | 'Closed' | 'Resolved';
type TicketPriority = 'High' | 'Medium' | 'Low';

interface SupportTicket {
  _id: string;
  subject: string;
  customerName: string;
  organizationName: string;
  status: TicketStatus;
  priority: TicketPriority;
  updatedAt: string;
}

interface AdminUser {
    _id: string;
    email: string;
    name: string;
}

interface TicketDetails extends SupportTicket {
    description: string;
    submittedBy: { name: string, email: string };
    assignedTo?: AdminUser;
    resolution?: string;
    createdAt: string;
}


export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [assignedAdminId, setAssignedAdminId] = useState<string | undefined>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { token } = useAuth();
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/support-tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch tickets.');
      setTickets(data);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenViewDialog = async (ticketId: string) => {
    setIsLoading(true);
    try {
        const response = await fetch(`/api/admin/support-tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch ticket details.');
        const data: TicketDetails = await response.json();
        setSelectedTicket(data);
        setIsViewOpen(true);
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenAssignDialog = async (ticket: SupportTicket) => {
    setIsLoading(true);
    try {
        const [ticketRes, adminsRes] = await Promise.all([
            fetch(`/api/admin/support-tickets/${ticket._id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!ticketRes.ok || !adminsRes.ok) throw new Error('Failed to load data for assignment.');
        
        const ticketData: TicketDetails = await ticketRes.json();
        const adminData: AdminUser[] = await adminsRes.json();

        setSelectedTicket(ticketData);
        setAdmins(adminData);
        setAssignedAdminId(ticketData.assignedTo?._id);
        setIsAssignOpen(true);
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<TicketDetails>) => {
    setIsUpdating(true);
    try {
        const response = await fetch(`/api/admin/support-tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update ticket.');
        toast({ title: 'Ticket Updated', description: 'The ticket has been successfully updated.' });
        fetchTickets(); // Refresh main list
        return true;
    } catch (e: any) {
        toast({ title: 'Update Error', description: e.message, variant: 'destructive' });
        return false;
    } finally {
        setIsUpdating(false);
    }
  };

  const handleAssignSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTicket) return;
    const success = await handleUpdateTicket(selectedTicket._id, { assignedTo: admins.find(a => a._id === assignedAdminId) });
    if (success) {
      setIsAssignOpen(false);
    }
  };
  
  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    await handleUpdateTicket(ticketId, { status: newStatus });
    if (selectedTicket?._id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
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
  
   const getPriorityBadgeVariant = (priority: TicketPriority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <>
      <PageHeader
        title="Support Tickets"
        description="Manage and respond to user support requests."
      />
      
       <Card className="shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine the list of support tickets. (Mock)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input placeholder="Search by subject or customer..." />
            <Select defaultValue="all">
              <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
             <Select defaultValue="all">
              <SelectTrigger><SelectValue placeholder="Filter by priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button>
                <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>A list of all support tickets in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            {isLoading && !isUpdating ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading support tickets...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="mt-2 text-destructive font-semibold">Failed to load tickets</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No support tickets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                      <TableRow key={ticket._id}>
                        <TableCell>
                            <div>
                                <p className="font-medium">{ticket.customerName}</p>
                                <p className="text-xs text-muted-foreground">{ticket.organizationName}</p>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
                        </TableCell>
                        <TableCell>{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => handleOpenViewDialog(ticket._id)}>View Ticket</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleOpenAssignDialog(ticket)}>Assign to Agent</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {ticket.status !== 'Closed' && ticket.status !== 'Resolved' ? (
                                <DropdownMenuItem onSelect={() => handleStatusChange(ticket._id, 'Closed')}>Close Ticket</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => handleStatusChange(ticket._id, 'Open')}>Re-open Ticket</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* View Ticket Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Ticket Details</DialogTitle>
                  <DialogDescription>{selectedTicket?.subject}</DialogDescription>
              </DialogHeader>
              {isLoading ? (<Loader2 className="h-8 w-8 animate-spin mx-auto my-10"/>) : selectedTicket && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                  <div className="md:col-span-2 space-y-4">
                    <Label>Description</Label>
                    <ScrollArea className="h-40 rounded-md border p-4 bg-secondary/30">
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                    </ScrollArea>
                    <Label>Resolution</Label>
                     <Textarea placeholder="Add resolution notes here..." defaultValue={selectedTicket.resolution}/>
                     <Button size="sm" onClick={() => toast({title: "Mock Action", description: "Resolution notes would be saved."})}>Save Notes</Button>
                  </div>
                  <div className="md:col-span-1 space-y-4">
                    <h4 className="font-semibold">Details</h4>
                    <Separator/>
                    <div className="text-sm space-y-3">
                       <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> <strong>Submitter:</strong> {selectedTicket.submittedBy.name}</p>
                       <p className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground"/> <strong>Org:</strong> {selectedTicket.organizationName}</p>
                       <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> <strong>Created:</strong> {format(new Date(selectedTicket.createdAt), 'PPp')}</p>
                       <p className="flex items-center gap-2"><Edit className="h-4 w-4 text-muted-foreground"/> <strong>Updated:</strong> {format(new Date(selectedTicket.updatedAt), 'PPp')}</p>
                       <div className="flex items-center gap-2"><strong>Status:</strong> <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>{selectedTicket.status}</Badge></div>
                       <div className="flex items-center gap-2"><strong>Priority:</strong> <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>{selectedTicket.priority}</Badge></div>
                       <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> <strong>Assigned:</strong> {selectedTicket.assignedTo?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                </div>
              )}
               <DialogFooter>
                    <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                </DialogFooter>
          </DialogContent>
      </Dialog>
      
       {/* Assign Ticket Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>Assign this ticket to an available administrator.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="py-4 space-y-4">
            <div>
                <Label htmlFor="assignee">Select Administrator</Label>
                <Select value={assignedAdminId} onValueChange={setAssignedAdminId}>
                    <SelectTrigger id="assignee">
                        <SelectValue placeholder="Select an admin" />
                    </SelectTrigger>
                    <SelectContent>
                        {admins.map(admin => (
                            <SelectItem key={admin._id} value={admin._id}>{admin.name} ({admin.email})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Assign Ticket
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
}
