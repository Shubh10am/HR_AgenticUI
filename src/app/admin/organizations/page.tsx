
'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Star, Trash2, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, ShieldOff, PauseCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { AdminOrganizationData } from '@/pages/api/admin/organizations/index';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { OrganizationStatus } from '@/models/Organization';

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<AdminOrganizationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) {
        throw new Error('Admin token not found.');
      }

      const response = await fetch(`/api/admin/organizations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch organizations');
      }

      const data: AdminOrganizationData[] = await response.json();
      setOrganizations(data);
    } catch (e: any) {
      setError(e.message);
      toast({
        title: 'Error Fetching Organizations',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleUpdateStatus = async (orgId: string, status: OrganizationStatus) => {
    try {
        const token = localStorage.getItem('adminAuthToken');
        if (!token) throw new Error('Admin token not found.');

        const response = await fetch(`/api/admin/organizations/${orgId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update status');
        }

        toast({ title: 'Status Updated', description: `Organization status set to ${status}.` });
        fetchOrganizations(); // Refresh the list to show the new status
    } catch (e: any) {
        toast({
            title: 'Error Updating Status',
            description: e.message,
            variant: 'destructive',
        });
    }
  };


  const getStatusComponent = (status: OrganizationStatus) => {
    switch (status) {
      case 'Active': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><ShieldCheck className="mr-1 h-3 w-3" /> Active</Badge>;
      case 'Suspended': return <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" /> Suspended</Badge>;
      case 'Hold': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><PauseCircle className="mr-1 h-3 w-3" /> On Hold</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading organizations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-destructive font-semibold">Failed to load organizations</p>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

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
                  <TableHead>Plan (Mock)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/organizations/${org._id}`} className="hover:underline">
                        <div>
                          <p>{org.name}</p>
                          <p className="text-sm text-muted-foreground">{org.emailDomain}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{org.adminName}</TableCell>
                    <TableCell>{org.userCount}</TableCell>
                    <TableCell>
                      <Badge className={getPlanBadgeClass('Enterprise')}>
                          <Star className="mr-1 h-3 w-3" />
                          Enterprise
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusComponent(org.status)}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/organizations/${org._id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/organizations/${org._id}`}>Manage Users</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(org._id, 'Active')} disabled={org.status === 'Active'}>Activate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(org._id, 'Hold')} disabled={org.status === 'Hold'}>Place on Hold</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(org._id, 'Suspended')} disabled={org.status === 'Suspended'}>Suspend</DropdownMenuItem>
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
