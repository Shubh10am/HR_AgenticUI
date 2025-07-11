
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreHorizontal, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, Activity, PauseCircle } from 'lucide-react';
import type { OrganizationDetailData } from '@/pages/api/admin/organizations/[id]';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import type { OrganizationStatus } from '@/models/Organization';

const mockActivityLog = [
    { id: 'act-1', description: "Admin 'Shubham' registered new employee 'John Doe'.", timestamp: new Date() },
    { id: 'act-2', description: "Organization status changed to 'Active'.", timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
    { id: 'act-3', description: "API Key was updated.", timestamp: new Date(new Date().setDate(new Date().getDate() - 2)) },
];


export default function OrganizationDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [orgDetails, setOrgDetails] = useState<OrganizationDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrgDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('adminAuthToken');
        if (!token) throw new Error('Admin token not found.');

        const response = await fetch(`/api/admin/organizations/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch organization details');
        }

        const data: OrganizationDetailData = await response.json();
        setOrgDetails(data);
      } catch (e: any) {
        setError(e.message);
        toast({
          title: 'Error Fetching Details',
          description: e.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrgDetails();
  }, [id, toast]);

  const getRoleVariant = (role: string) => {
    if (role === 'Admin') return 'default';
    if (role === 'HR') return 'secondary';
    return 'outline';
  };

  const getStatusComponent = (status: OrganizationStatus) => {
    switch (status) {
      case 'Active': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><ShieldCheck className="mr-1 h-3 w-3" /> Active</Badge>;
      case 'Suspended': return <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" /> Suspended</Badge>;
      case 'Hold': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black"><PauseCircle className="mr-1 h-3 w-3" /> On Hold</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading organization details...</p>
      </div>
    );
  }

  if (error || !orgDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-destructive font-semibold">Failed to load organization details</p>
        <p className="text-sm text-destructive/80">{error || 'Organization data is not available.'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={orgDetails.name}
        description={`Details for organization ID: ${orgDetails._id}`}
      >
        <Button asChild variant="outline">
          <Link href="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
          </Link>
        </Button>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
              <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{orgDetails.employees.length}</p></CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>Status</CardTitle></CardHeader>
              <CardContent>{getStatusComponent(orgDetails.status)}</CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>Admin</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-medium">{orgDetails.employees.find(e => e.role === 'Admin')?.name || 'N/A'}</p></CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>Email Domain</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-medium">{orgDetails.emailDomain}</p></CardContent>
          </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Employees</CardTitle>
                <CardDescription>A list of all employees in this organization.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orgDetails.employees.map((user) => (
                        <TableRow key={user._id}>
                            <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0).toUpperCase()}`} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                <p>{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            </TableCell>
                            <TableCell>
                            <Badge variant={getRoleVariant(user.role)}>
                                {user.role}
                            </Badge>
                            </TableCell>
                            <TableCell>{user.department || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-primary" />
                        Recent Activity Log
                    </CardTitle>
                    <CardDescription>A log of recent important events for this organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {mockActivityLog.map(log => (
                        <div key={log.id} className="flex items-start gap-3">
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            <div>
                                <p className="text-sm">{log.description}</p>
                                <p className="text-xs text-muted-foreground">{format(log.timestamp, 'PPP p')}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
