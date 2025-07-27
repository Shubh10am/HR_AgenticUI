
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Loader2, AlertTriangle, Shield, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminUserData } from '@/pages/api/admin/users/index';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageWithFallback from '@/components/image-with-fallback';

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser, token: authToken } = useAuth();

  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<AdminUserData | null>(null);
  const [editRole, setEditRole] = useState<'SuperAdmin' | 'Admin'>('Admin');
  const [isUpdating, setIsUpdating] = useState(false);

  // State for deleting
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!authToken) {
        throw new Error('Authentication token not found.');
      }

      const response = await fetch(`/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data: AdminUserData[] = await response.json();
      setAdmins(data);
    } catch (e: any) {
      setError(e.message);
      toast({
        title: 'Error Fetching Admins',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(authToken) {
        fetchAdmins();
    } else {
        setIsLoading(false);
        setError("Authentication token not available.");
    }
  }, [authToken, toast]);

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
          'Authorization': `Bearer ${authToken}`,
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
      fetchAdmins(); // Refresh admin list
    } catch (e: any) {
      toast({ title: 'Error Adding Admin', description: e.message, variant: 'destructive' });
    } finally {
      setIsAddingAdmin(false);
    }
  };
  
  const handleOpenEditDialog = (admin: AdminUserData) => {
    setAdminToEdit(admin);
    setEditRole(admin.role);
    setIsEditDialogOpen(true);
  };
  
  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminToEdit) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${adminToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ role: editRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast({ title: 'Admin Updated', description: `${adminToEdit.email}'s role has been updated.` });
      setIsEditDialogOpen(false);
      fetchAdmins();
    } catch (e: any) {
       toast({ title: 'Error Updating Admin', description: e.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
      setAdminToEdit(null);
    }
  }

  const handleOpenDeleteDialog = (admin: AdminUserData) => {
    setAdminToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);
    try {
        const response = await fetch(`/api/admin/users/${adminToDelete._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        toast({ title: 'Admin Deleted', description: `${adminToDelete.email} has been deleted.` });
        fetchAdmins();
    } catch (e: any) {
        toast({ title: 'Error Deleting Admin', description: e.message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setAdminToDelete(null);
    }
  };

  const getRoleVariant = (role: string) => {
    if (role === 'SuperAdmin') return 'destructive';
    if (role === 'Admin') return 'default';
    return 'outline';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading administrators...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-destructive font-semibold">Failed to load administrators</p>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Platform Administrators"
        description="View and manage SuperAdmin and Admin users."
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
          <CardTitle>Platform Admins</CardTitle>
          <CardDescription>A list of all administrators and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((user, index) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                           <ImageWithFallback src={`https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${index}.jpg`} fallbackSrc="https://placehold.co/40x40.png" alt={user.name} width={40} height={40} className="rounded-full" data-ai-hint="person face" />
                           <AvatarFallback><Shield className="h-4 w-4 text-muted-foreground"/></AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{user.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0" disabled={currentUser?.id === user._id}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4"/> Edit Admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(user)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Admin
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
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Admin: {adminToEdit?.email}</DialogTitle>
                <DialogDescription>Change the role for this administrator.</DialogDescription>
            </DialogHeader>
            <form id="edit-admin-form" onSubmit={handleEditSubmit} className="space-y-4 py-2">
                 <div>
                    <Label htmlFor="editRole">Role</Label>
                    <Select value={editRole} onValueChange={(value) => setEditRole(value as 'SuperAdmin' | 'Admin')} disabled={isUpdating}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="SuperAdmin">SuperAdmin (Use with caution)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </form>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
                <Button type="submit" form="edit-admin-form" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the admin account for <strong>{adminToDelete?.email}</strong>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={handleDeleteAdmin} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Yes, delete admin
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
