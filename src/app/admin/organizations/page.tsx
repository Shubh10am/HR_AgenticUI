
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, User, Star, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const organizations = [
  { id: 1, name: 'Tech Innovations Inc.', domain: 'techinc.io', admin: 'Aisha Smith', users: 25, plan: 'Enterprise', status: 'Active' },
  { id: 2, name: 'New Corp', domain: 'newcorp.com', admin: 'John Doe', users: 10, plan: 'Pro', status: 'Active' },
  { id: 3, name: 'WebStart Solutions', domain: 'webstart.es', admin: 'Maria Garcia', users: 5, plan: 'Free', status: 'Active' },
  { id: 4, name: 'Data Systems Ltd.', domain: 'datasys.co', admin: 'David Chen', users: 50, plan: 'Enterprise', status: 'Inactive' },
];

export default function AdminOrganizationsPage() {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Inactive': return 'outline';
      default: return 'secondary';
    }
  };

   const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case 'Enterprise': return 'bg-purple-600 text-white';
      case 'Pro': return 'bg-blue-500 text-white';
      case 'Free': return 'bg-gray-500 text-white';
      default: return '';
    }
  };

  return (
    <>
      <PageHeader
        title="Organization Management"
        description="View and manage all registered organizations on the platform."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Organization
        </Button>
      </PageHeader>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>A list of all registered organizations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.domain}</p>
                      </div>
                    </TableCell>
                    <TableCell>{org.admin}</TableCell>
                    <TableCell>{org.users}</TableCell>
                    <TableCell>
                      <Badge className={getPlanBadgeClass(org.plan)}>
                          {org.plan === 'Enterprise' && <Star className="mr-1 h-3 w-3" />}
                          {org.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(org.status)}>
                        {org.status}
                      </Badge>
                    </TableCell>
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
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Manage Users</DropdownMenuItem>
                          <DropdownMenuItem>Change Plan</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Organization
                          </DropdownMenuItem>
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
