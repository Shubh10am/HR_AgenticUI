'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type TicketStatus = 'Open' | 'In Progress' | 'Closed';
type TicketPriority = 'High' | 'Medium' | 'Low';

interface SupportTicket {
  id: string;
  subject: string;
  customer: string;
  organization: string;
  status: TicketStatus;
  priority: TicketPriority;
  lastUpdated: string;
}

const mockTickets: SupportTicket[] = [
  { id: 'TKT-001', subject: 'API Key not working', customer: 'Alice Johnson', organization: 'Innovate Inc.', status: 'Open', priority: 'High', lastUpdated: '2 hours ago' },
  { id: 'TKT-002', subject: 'Billing question', customer: 'Bob Williams', organization: 'Data Corp', status: 'In Progress', priority: 'Medium', lastUpdated: '1 day ago' },
  { id: 'TKT-003', subject: 'Feature request: Dark mode for dashboard', customer: 'Charlie Brown', organization: 'Creative LLC', status: 'Closed', priority: 'Low', lastUpdated: '3 days ago' },
  { id: 'TKT-004', subject: 'Unable to add new user', customer: 'Diana Prince', organization: 'Solutions Co.', status: 'Open', priority: 'Medium', lastUpdated: '5 minutes ago' },
  { id: 'TKT-005', subject: 'Integration with Slack failed', customer: 'Eve Adams', organization: 'Connectify', status: 'In Progress', priority: 'High', lastUpdated: 'Yesterday' },
];

export default function AdminSupportTicketsPage() {

  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Closed': return 'default';
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
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Ticket
        </Button>
      </PageHeader>
      
       <Card className="shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine the list of support tickets.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input placeholder="Search by subject or customer..." />
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
             <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono">{ticket.id}</TableCell>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>
                        <div>
                            <p>{ticket.customer}</p>
                            <p className="text-xs text-muted-foreground">{ticket.organization}</p>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
                    </TableCell>
                     <TableCell>{ticket.lastUpdated}</TableCell>
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
                          <DropdownMenuItem>View Ticket</DropdownMenuItem>
                          <DropdownMenuItem>Assign to Agent</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Close Ticket</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
