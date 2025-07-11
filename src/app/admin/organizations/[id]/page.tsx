
'use client';

import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreHorizontal, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, Activity, PauseCircle, List, LayoutGrid, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import type { OrganizationDetailData } from '@/pages/api/admin/organizations/[id]';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import type { OrganizationStatus } from '@/models/Organization';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mockActivityLog = [
    { id: 'act-1', description: "Admin 'Shubham' registered new employee 'John Doe'.", timestamp: new Date() },
    { id: 'act-2', description: "Organization status changed to 'Active'.", timestamp: new Date(new Date().setDate(new Date().getDate() - 1)) },
    { id: 'act-3', description: "API Key was updated.", timestamp: new Date(new Date().setDate(new Date().getDate() - 2)) },
];

const ITEMS_PER_PAGE = 10;

type OrgEmployee = OrganizationDetailData['employees'][0];

const roleSortOrder = {
  'Admin': 1,
  'HR': 2,
  'Employee': 3,
};

export default function OrganizationDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [orgDetails, setOrgDetails] = useState<OrganizationDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const filteredEmployees = useMemo(() => {
    if (!orgDetails) return [];
    
    const filtered = orgDetails.employees.filter(employee => {
      const searchLower = searchQuery.toLowerCase();
      const deptLower = departmentFilter.toLowerCase();
      
      const matchesSearch = !searchQuery || employee.name.toLowerCase().includes(searchLower);
      const matchesRole = roleFilter === 'All' || employee.role === roleFilter;
      const matchesDept = !departmentFilter || (employee.department && employee.department.toLowerCase().includes(deptLower));
      
      return matchesSearch && matchesRole && matchesDept;
    });

    // Now sort the filtered results
    return filtered.sort((a, b) => {
        const roleA = roleSortOrder[a.role as keyof typeof roleSortOrder] || 99;
        const roleB = roleSortOrder[b.role as keyof typeof roleSortOrder] || 99;
        if (roleA !== roleB) {
            return roleA - roleB;
        }
        return a.name.localeCompare(b.name);
    });

  }, [orgDetails, searchQuery, roleFilter, departmentFilter]);
  
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    // Reset page to 1 whenever filters change
    setCurrentPage(1);
  }, [searchQuery, roleFilter, departmentFilter]);


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
  
  const handleDownloadCsv = () => {
    if (filteredEmployees.length === 0) {
      toast({ title: 'No Data', description: 'No employees match the current filters to download.', variant: 'destructive' });
      return;
    }

    const headers = ['Name', 'Email', 'Role', 'Department'];
    const csvContent = [
      headers.join(','),
      ...filteredEmployees.map(emp => [
        `"${emp.name}"`,
        `"${emp.email}"`,
        `"${emp.role}"`,
        `"${emp.department || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${orgDetails?.name || 'organization'}_employees.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'CSV Downloaded', description: `Report for ${filteredEmployees.length} employees is being downloaded.` });
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
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadCsv}>
                <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
            <Button asChild variant="outline">
            <Link href="/admin/organizations">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
            </Button>
        </div>
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
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <CardTitle>Employees ({filteredEmployees.length} of {orgDetails.employees.length})</CardTitle>
                            <CardDescription>A list of all employees in this organization.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
                            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="mt-4 border-t pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="searchName">Search by Name</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="searchName" placeholder="e.g., John Doe" className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="filterRole">Filter by Role</Label>
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger id="filterRole" className="mt-1">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Roles</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="HR">HR</SelectItem>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="searchDept">Search by Department</Label>
                                <Input id="searchDept" placeholder="e.g., Engineering" className="mt-1" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}/>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                 {viewMode === 'table' ? (
                  <>
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
                          {paginatedEmployees.map((user) => (
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
                          {paginatedEmployees.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No employees found matching your criteria.
                                </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                      </Table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                            <ChevronLeft className="mr-2 h-4 w-4"/> Previous
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                            Next <ChevronRight className="ml-2 h-4 w-4"/>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                  ) : (
                    <>
                        {paginatedEmployees.length === 0 ? (
                             <div className="text-center py-10 text-muted-foreground">
                                No employees found matching your criteria.
                            </div>
                        ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedEmployees.map((user) => (
                                <Card key={user._id} className="p-4 flex flex-col items-center text-center">
                                    <Avatar className="h-16 w-16 mb-2">
                                        <AvatarImage src={`https://placehold.co/64x64.png?text=${user.name.charAt(0).toUpperCase()}`} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold truncate w-full">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate w-full">{user.email}</p>
                                    <p className="text-xs text-muted-foreground truncate w-full mt-1">{user.department || 'No Department'}</p>
                                    <Badge variant={getRoleVariant(user.role)} className="mt-2">{user.role}</Badge>
                                </Card>
                            ))}
                        </div>
                        )}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <ChevronLeft className="mr-2 h-4 w-4"/> Previous
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                Next <ChevronRight className="ml-2 h-4 w-4"/>
                              </Button>
                            </div>
                          </div>
                        )}
                    </>
                  )}
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
