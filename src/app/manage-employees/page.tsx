
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { EmployeeRole } from '@/models/Employee';
import { Loader2, UserPlus, Users, Trash2, Edit3, UploadCloud } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Papa from 'papaparse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface ClientEmployee {
  _id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  organizationId: string;
  avatarUrl?: string;
  dataAiHint?: string;
  department?: string;
}

export default function ManageEmployeesPage() {
  const { toast } = useToast();
  const { user: adminUser, token, isLoading: authLoading } = useAuth();

  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole>('Employee');
  const [employeeDepartment, setEmployeeDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentEmployees, setCurrentEmployees] = useState<ClientEmployee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [orgDomain, setOrgDomain] = useState<string | null>(null);

  const [employeeToDelete, setEmployeeToDelete] = useState<ClientEmployee | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<ClientEmployee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<EmployeeRole>('Employee');
  const [editDepartment, setEditDepartment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // State for bulk upload
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // State for bulk delete
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [deleteCsvFile, setDeleteCsvFile] = useState<File | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);


  const handleEditEmployee = async () => {
    if (!employeeToEdit || !token) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/employees/${employeeToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, role: editRole, department: editDepartment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      toast({ title: 'Employee Updated', description: `${data.name}'s profile has been updated.` });
      setIsEditDialogOpen(false);
      fetchEmployees(); // Refresh list
    } catch (error: any) {
      toast({ title: 'Update Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const roleSortOrder: Record<EmployeeRole, number> = {
    'Admin': 1,
    'HR': 2,
    'Manager': 3,
    'Employee': 4,
  };

  const fetchEmployees = useCallback(async () => {
    if (!adminUser || !token || adminUser.role !== 'Admin') return;
    setIsLoadingEmployees(true);
    try {
      const response = await fetch(`/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employees');
      }
      const data: ClientEmployee[] = await response.json();

      const sortedData = data.sort((a, b) => {
          const roleA = roleSortOrder[a.role] || 99;
          const roleB = roleSortOrder[b.role] || 99;
          if (roleA !== roleB) {
              return roleA - roleB;
          }
          return a.name.localeCompare(b.name);
      });

      setCurrentEmployees(sortedData.map(emp => ({
        ...emp,
        avatarUrl: `https://placehold.co/40x40.png?text=${emp.name.charAt(0).toUpperCase()}`,
        dataAiHint: `${emp.role.toLowerCase()} avatar`
      })));
    } catch (error: any) {
      toast({ title: 'Error Fetching Employees', description: error.message, variant: 'destructive' });
      setCurrentEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [adminUser, token, toast]);

  useEffect(() => {
    if (adminUser && adminUser.email) {
      const domain = adminUser.email.substring(adminUser.email.lastIndexOf('@') + 1);
      setOrgDomain(domain);
    }
    fetchEmployees();
  }, [adminUser, fetchEmployees]);


  const handleRegisterEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminUser || !orgDomain || !token) {
      toast({ title: 'Error', description: 'Admin details not found or not authenticated.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!employeeEmail.endsWith(`@${orgDomain}`)) {
      toast({ title: 'Invalid Email Domain', description: `Employee email must belong to your organization's domain (@${orgDomain}).`, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: employeeName, email: employeeEmail, password, role: employeeRole, department: employeeDepartment }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register employee');
      }

      toast({
        title: 'Employee Registered',
        description: `${data.name} (${data.email}) has been added as an ${data.role}.`,
      });

      setEmployeeName('');
      setEmployeeEmail('');
      setEmployeeRole('Employee');
      setEmployeeDepartment('');
      setPassword('');
      setConfirmPassword('');
      fetchEmployees();
    } catch (error: any) {
      toast({ title: 'Registration Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirmation = (employee: ClientEmployee) => {
    setEmployeeToDelete(employee);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete || !token) return;

    try {
      const response = await fetch(`/api/employees/${employeeToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete employee');
      }

      toast({ title: 'Employee Deleted', description: `${employeeToDelete.name} has been removed.` });
      fetchEmployees();
    } catch (error: any) {
      toast({ title: 'Deletion Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const handleBulkUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!csvFile) {
        toast({ title: 'No File Selected', description: 'Please select a CSV file to upload.', variant: 'destructive' });
        return;
    }
    setIsBulkSubmitting(true);
    Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const employees = results.data;
            if (employees.length === 0) {
                toast({ title: 'Empty CSV', description: 'The selected CSV file is empty or invalid.', variant: 'destructive' });
                setIsBulkSubmitting(false);
                return;
            }

            try {
              const response = await fetch('/api/employees/bulk', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({ employees }),
              });
              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Failed to process bulk registration.');
              }

              toast({
                title: 'Bulk Registration Processed',
                description: `Successfully created ${data.createdCount} employees. Failed: ${data.failedCount}.`,
              });
              if (data.failedCount > 0) {
                console.warn("Failed registrations:", data.errors);
                 toast({
                  title: 'Some Registrations Failed',
                  description: 'Check the browser console for a list of errors.',
                  variant: 'destructive',
                  duration: 10000,
                });
              }
              fetchEmployees(); // Refresh the employee list
              setIsBulkUploadOpen(false);
              setCsvFile(null);
            } catch (error: any) {
              toast({ title: 'Bulk Upload Error', description: error.message, variant: 'destructive' });
            } finally {
              setIsBulkSubmitting(false);
            }
        },
        error: (error: any) => {
            toast({ title: 'CSV Parsing Error', description: error.message, variant: 'destructive' });
            setIsBulkSubmitting(false);
        }
    });
  };

  const handleBulkDelete = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deleteCsvFile) {
        toast({ title: 'No File Selected', description: 'Please select a CSV file for deletion.', variant: 'destructive' });
        return;
    }
    setIsBulkDeleting(true);
    Papa.parse(deleteCsvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const employeesToDelete = results.data;
            if (employeesToDelete.length === 0) {
                toast({ title: 'Empty CSV', description: 'The deletion CSV is empty.', variant: 'destructive' });
                setIsBulkDeleting(false);
                return;
            }

            const emails = (employeesToDelete as { email: string }[]).map(e => e.email).filter(Boolean);
            if (emails.length === 0) {
                toast({ title: 'Invalid Format', description: 'CSV must contain an "email" column.', variant: 'destructive' });
                setIsBulkDeleting(false);
                return;
            }

            try {
              const response = await fetch('/api/employees/bulk-delete', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({ emails }),
              });
              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Failed to process bulk deletion.');
              }

              toast({
                title: 'Bulk Deletion Processed',
                description: `Successfully deleted ${data.deletedCount} employees. Failed: ${data.failedCount}.`,
              });
               if (data.failedCount > 0) {
                console.warn("Failed deletions:", data.errors);
                 toast({
                  title: 'Some Deletions Failed',
                  description: 'Check the browser console for a list of errors.',
                  variant: 'destructive',
                  duration: 10000,
                });
              }
              fetchEmployees();
              setIsBulkDeleteOpen(false);
              setDeleteCsvFile(null);
            } catch (error: any) {
              toast({ title: 'Bulk Deletion Error', description: error.message, variant: 'destructive' });
            } finally {
              setIsBulkDeleting(false);
            }
        },
        error: (error: any) => {
            toast({ title: 'CSV Parsing Error', description: error.message, variant: 'destructive' });
            setIsBulkDeleting(false);
        }
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'Admin') {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="text-center p-8">
          <CardTitle>Access Denied</CardTitle>
          <CardDescription className="mt-2">You do not have permission to view this page.</CardDescription>
          <Button onClick={() => window.history.back()} className="mt-4">Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => {
      setIsDeleteAlertOpen(open);
      if (!open) setEmployeeToDelete(null);
    }}>
      <PageHeader
        title="Manage Employees"
        description={`Oversee and add employees for ${adminUser?.name}'s organization.`}
      >
        <div className="flex items-center gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <UploadCloud className="mr-2 h-4 w-4" /> Bulk Register
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Employee Registration</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file to register multiple employees at once.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
                        <p className="font-semibold text-foreground mb-1">CSV Format Requirements:</p>
                        <p>The file must contain a header row with the following columns: <code className="bg-muted px-1 py-0.5 rounded">name</code>, <code className="bg-muted px-1 py-0.5 rounded">email</code>, <code className="bg-muted px-1 py-0.5 rounded">password</code>, <code className="bg-muted px-1 py-0.5 rounded">role</code>, <code className="bg-muted px-1 py-0.5 rounded">department</code> (optional).</p>
                    </div>
                    <form id="bulk-upload-form" onSubmit={handleBulkUpload}>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="csvFile">CSV File</Label>
                            <Input id="csvFile" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)} required disabled={isBulkSubmitting}/>
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsBulkUploadOpen(false)} disabled={isBulkSubmitting}>Cancel</Button>
                        <Button type="submit" form="bulk-upload-form" disabled={isBulkSubmitting || !csvFile}>
                            {isBulkSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Upload and Register
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Bulk Delete
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Employee Deletion</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file with emails to delete multiple employees. This action is irreversible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-sm text-muted-foreground bg-destructive/10 p-3 rounded-md border border-destructive/20">
                        <p className="font-semibold text-destructive mb-1">CSV Format Requirements:</p>
                        <p>The file must contain a single column with the header: <code className="bg-muted px-1 py-0.5 rounded">email</code>.</p>
                    </div>
                    <form id="bulk-delete-form" onSubmit={handleBulkDelete}>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="deleteCsvFile">Deletion CSV File</Label>
                            <Input id="deleteCsvFile" type="file" accept=".csv" onChange={(e) => setDeleteCsvFile(e.target.files ? e.target.files[0] : null)} required disabled={isBulkDeleting}/>
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsBulkDeleteOpen(false)} disabled={isBulkDeleting}>Cancel</Button>
                        <Button type="submit" form="bulk-delete-form" variant="destructive" disabled={isBulkDeleting || !deleteCsvFile}>
                            {isBulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Delete Employees
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-6 w-6 text-primary" />
              Register New Employee
            </CardTitle>
            <CardDescription>Add a new member to your organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterEmployee} className="space-y-4">
              <div>
                <Label htmlFor="employeeName">Full Name</Label>
                <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="e.g., Jane Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="employeeEmail">Email Address</Label>
                <Input
                  id="employeeEmail"
                  type="email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  placeholder={`e.g., jane.doe@${orgDomain || 'yourdomain.com'}`}
                  required
                  disabled={isSubmitting}
                />
                {orgDomain && <p className="text-xs text-muted-foreground mt-1">Must use @{orgDomain} domain.</p>}
              </div>
               <div>
                <Label htmlFor="employeeDepartment">Department (Optional)</Label>
                <Input
                  id="employeeDepartment"
                  value={employeeDepartment}
                  onChange={(e) => setEmployeeDepartment(e.target.value)}
                  placeholder="e.g., Engineering, Sales"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="employeeRole">Role / Position</Label>
                <Select value={employeeRole} onValueChange={(value: EmployeeRole) => setEmployeeRole(value)} required disabled={isSubmitting}>
                  <SelectTrigger id="employeeRole">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Register Employee
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              Current Employees
            </CardTitle>
            <CardDescription>List of employees in your organization.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading employees...</p>
              </div>
            ) : currentEmployees.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No employees registered yet.</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentEmployees.map((employee) => (
                      <TableRow key={employee._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint={employee.dataAiHint} />
                              <AvatarFallback>{employee.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {employee.name}
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant={employee.role === 'Admin' ? 'default' : employee.role === 'HR' ? 'secondary' : 'outline'}>
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.department || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => {
                              setEmployeeToEdit(employee);
                              setEditName(employee.name);
                              setEditRole(employee.role);
                              setEditDepartment(employee.department || '');
                              setIsEditDialogOpen(true);
                            }}
                          >

                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          {adminUser?._id !== employee._id && adminUser?.id !== employee._id && (
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8" onClick={() => openDeleteConfirmation(employee)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {employeeToEdit && (
        <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Make changes to {employeeToEdit.name}'s profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="editName">Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div>
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g., Engineering, Sales"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select value={editRole} onValueChange={(value: EmployeeRole) => setEditRole(value)} required disabled={isUpdating}>
                  <SelectTrigger id="editRole">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEditEmployee} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the employee account for {employeeToDelete?.name}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteEmployee} className={buttonVariants({ variant: "destructive" })}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
