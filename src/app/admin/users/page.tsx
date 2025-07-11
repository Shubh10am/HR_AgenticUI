
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminUserData } from '@/pages/api/admin/users/index';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context'; // Import the main auth hook

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { token: authToken } = useAuth(); // Use the token from the auth context

  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!authToken) { // Check if the auth token from context exists
        throw new Error('Authentication token not found.');
      }

      const response = await fetch(`/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` } // Use the correct token
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data: AdminUserData[] = await response.json();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
      toast({
        title: 'Error Fetching Users',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(authToken) { // Only fetch if token is available
        fetchUsers();
    } else {
        setIsLoading(false);
        setError("Authentication token not available.");
    }
  }, [authToken]); // Rerun effect when token changes

  const handleAddAdminSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newAdminPassword !== newAdminConfirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setIsAddingAdmin(true);
    try {
      if (!authToken) {
        throw new Error('Authentication token not found.');
      }
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, // Use the correct token
        },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword, role: 'Admin' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }

      toast({ title: 'Admin User Added', description: `${data.email} has been added as an Admin.` });
      setIsAddAdminDialogOpen(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminConfirmPassword('');
      fetchUsers(); // Refresh user list
    } catch (e: any) {
      toast({ title: 'Error Adding Admin', description: e.message, variant: 'destructive' });
    } finally {
      setIsAddingAdmin(false);
    }
  };


  const getRoleVariant = (role: string) => {
    if (role === 'SuperAdmin') return 'destructive';
    if (role === 'Admin') return 'default';
    if (role === 'HR') return 'secondary';
    return 'outline';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-destructive font-semibold">Failed to load users</p>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="View and manage all platform and organization users."
      >
        <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Platform Admin</DialogTitle>
                    <DialogDescription>
                        This will create a new administrator with access to the admin panel.
                    </DialogDescription>
                </DialogHeader>
                <form id="add-admin-form" onSubmit={handleAddAdminSubmit} className="space-y-4 py-2">
                    <div>
                        <Label htmlFor="adminEmail">Email Address</Label>
                        <Input id="adminEmail" type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required disabled={isAddingAdmin} />
                    </div>
                     <div>
                        <Label htmlFor="adminPassword">Password</Label>
                        <Input id="adminPassword" type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required minLength={8} disabled={isAddingAdmin} />
                    </div>
                     <div>
                        <Label htmlFor="adminConfirmPassword">Confirm Password</Label>
                        <Input id="adminConfirmPassword" type="password" value={newAdminConfirmPassword} onChange={(e) => setNewAdminConfirmPassword(e.target.value)} required disabled={isAddingAdmin} />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAdminDialogOpen(false)} disabled={isAddingAdmin}>Cancel</Button>
                    <Button type="submit" form="add-admin-form" disabled={isAddingAdmin}>
                        {isAddingAdmin && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Create Admin
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </PageHeader>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all registered users and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                    <TableCell>{user.organizationName}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(user.role)}>
                        {user.role}
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
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete User</DropdownMenuItem>
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
