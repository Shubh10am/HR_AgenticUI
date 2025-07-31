'use client';

import { useState, type FormEvent, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Eye, Link as LinkIcon, MoreHorizontal, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type OnboardingStatus = 'Pending' | 'Submitted' | 'Under Review' | 'Completed' | 'Action Required';

interface OnboardingEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  joiningDate: Date;
  status: OnboardingStatus;
}

const mockOnboardingData: OnboardingEmployee[] = [
  { id: '1', name: 'Divya Sharma', email: 'divya.s@examplecorp.com', role: 'Software Engineer', joiningDate: new Date('2024-08-01'), status: 'Completed' },
  { id: '2', name: 'Rohan Mehta', email: 'rohan.m@examplecorp.com', role: 'Product Manager', joiningDate: new Date('2024-08-05'), status: 'Submitted' },
  { id: '3', name: 'Priya Singh', email: 'priya.s@examplecorp.com', role: 'UX Designer', joiningDate: new Date('2024-08-10'), status: 'Pending' },
  { id: '4', name: 'Amit Patel', email: 'amit.p@examplecorp.com', role: 'QA Tester', joiningDate: new Date('2024-08-08'), status: 'Action Required' },
];

export default function EmployeeOnboardingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !mobile || !role) {
      toast({ title: 'Missing Fields', description: 'Please fill out all required fields.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      toast({
        title: 'Onboarding Initiated (Mock)',
        description: `An invitation link has been sent to ${email}.`,
      });
      setIsSubmitting(false);
      setFullName('');
      setEmail('');
      setMobile('');
      setRole('');
    }, 1500);
  };
  
  const getStatusBadgeVariant = (status: OnboardingStatus) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Submitted': return 'secondary';
      case 'Pending': return 'outline';
      case 'Action Required': return 'destructive';
      case 'Under Review': return 'secondary';
      default: return 'outline';
    }
  };
  
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return mockOnboardingData;
    return mockOnboardingData.filter(item => item.status === statusFilter);
  }, [statusFilter]);

  const handleViewDetails = (id: string) => {
      // In a real app, this would navigate to a detailed view of the submission.
      // For now, we can use the mock token page.
      router.push(`/onboarding/onboarding-token-for-${id}`);
  };

  return (
    <>
      <PageHeader
        title="Employee Onboarding"
        description="Initiate and track the onboarding process for new hires."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary"/> Add New Employee</CardTitle>
            <CardDescription>Enter details to start the onboarding process.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} required disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="role">Job Role</Label>
                <Input id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., Software Engineer" required disabled={isSubmitting} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Send Onboarding Link
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Onboarding Tracker</CardTitle>
                    <CardDescription>Monitor the status of new employee onboardings.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground"/>
                     <select
                        className="text-sm p-1.5 border rounded-md bg-transparent"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as OnboardingStatus | 'all')}
                     >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Action Required">Action Required</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground">{emp.email}</div>
                      </TableCell>
                      <TableCell>{format(emp.joiningDate, 'PPP')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(emp.status)}>{emp.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(emp.id)}>
                            <Eye className="h-4 w-4" />
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
    </>
  );
}