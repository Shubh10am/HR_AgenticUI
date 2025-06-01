
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { EmployeeRole, IEmployee } from '@/models/Employee'; // Assuming IEmployee is exported or use a client-side type
import { Loader2, UserPlus, Users } from 'lucide-react';

// Client-side mock employee type (subset of IEmployee)
interface MockEmployee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  avatarUrl?: string;
  dataAiHint?: string;
}

const initialMockEmployees: MockEmployee[] = [
  { id: 'emp1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'Employee', avatarUrl: 'https://placehold.co/40x40.png', dataAiHint: 'woman avatar' },
  { id: 'emp2', name: 'Bob The Builder', email: 'bob@example.com', role: 'HR', avatarUrl: 'https://placehold.co/40x40.png', dataAiHint: 'man avatar' },
  { id: 'emp3', name: 'Charlie Chaplin', email: 'charlie@example.com', role: 'Employee', avatarUrl: 'https://placehold.co/40x40.png', dataAiHint: 'person avatar' },
];


export default function ManageEmployeesPage() {
  const { toast } = useToast();
  const { user: adminUser, isLoading: authLoading } = useAuth();

  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole>('Employee');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentEmployees, setCurrentEmployees] = useState<MockEmployee[]>([]);
  const [orgDomain, setOrgDomain] = useState<string | null>(null);

  useEffect(() => {
    if (adminUser && adminUser.email) {
      const domain = adminUser.email.substring(adminUser.email.lastIndexOf('@') + 1);
      setOrgDomain(domain);
      // Filter mock employees to show only those matching the admin's domain for realism
      setCurrentEmployees(initialMockEmployees.map(emp => ({...emp, email: `${emp.email.split('@')[0]}@${domain}`})));
    }
  }, [adminUser]);


  const handleRegisterEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminUser || !orgDomain) {
      toast({ title: 'Error', description: 'Admin details not found. Cannot register employee.', variant: 'destructive' });
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newEmployeeData: MockEmployee = {
      id: `emp-${Date.now()}`,
      name: employeeName,
      email: employeeEmail,
      role: employeeRole,
      avatarUrl: 'https://placehold.co/40x40.png', // Generic placeholder
      dataAiHint: 'new employee avatar',
    };
    
    // Add to mock list for UI update
    setCurrentEmployees(prev => [...prev, newEmployeeData]);

    toast({
      title: 'Employee Registered (Mock)',
      description: `${employeeName} (${employeeEmail}) has been added as an ${employeeRole}.`,
    });

    // Reset form
    setEmployeeName('');
    setEmployeeEmail('');
    setEmployeeRole('Employee');
    setPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
  };
  
  if (authLoading || !adminUser) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (adminUser.role !== 'Admin') {
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
    <>
      <PageHeader
        title="Manage Employees"
        description={`Oversee and add employees for ${adminUser?.name}'s organization.`}
      />
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
                <Label htmlFor="employeeRole">Role</Label>
                <Select
                  value={employeeRole}
                  onValueChange={(value: EmployeeRole) => setEmployeeRole(value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="employeeRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
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
            <CardDescription>List of employees in your organization (Mock Data).</CardDescription>
          </CardHeader>
          <CardContent>
            {currentEmployees.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No employees registered yet, or data is loading.</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint={employee.dataAiHint} />
                              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
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
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => toast({title: `Edit ${employee.name} (Mock)`})}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => toast({title: `Delete ${employee.name} (Mock)`, variant: 'destructive'})}>Delete</Button>
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
    </>
  );
}

    