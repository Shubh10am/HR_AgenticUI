
'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { Loader2, AlertTriangle, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation'; // Import useRouter

interface PresentEmployee {
  _id: string;
  name: string;
  department?: string;
  clockInTime: string;
}

interface AbsentEmployee {
  _id: string;
  name: string;
  department?: string;
  leaveType?: string;
}

interface DashboardData {
  presentEmployees: PresentEmployee[];
  absentEmployees: AbsentEmployee[];
}

export default function AttendanceManagementPage() {
  const { toast } = useToast();
  const { token, user } = useAuth();
  const router = useRouter(); // Initialize router

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/attendance/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendance dashboard data.');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (e: any)      const data = await response.json();
      setDashboardData(data);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRowClick = (employeeId: string) => {
    router.push(`/manage-employees/${employeeId}`);
  };

  const IST_TIMEZONE = 'Asia/Kolkata';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading attendance dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-destructive font-semibold">Failed to load dashboard</p>
        <p className="text-sm text-destructive/80">{error}</p>
        <Button onClick={fetchDashboardData} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Attendance Management"
        description={`Daily overview of employee attendance for ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`}
      >
        <Button onClick={fetchDashboardData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Present Today ({dashboardData?.presentEmployees.length || 0})</CardTitle>
            <CardDescription>Employees who have clocked in today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Clock-In Time (IST)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.presentEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No employees have clocked in yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboardData?.presentEmployees.map(emp => (
                      <TableRow key={emp._id} onClick={() => handleRowClick(emp._id)} className="cursor-pointer">
                        <TableCell>
                           <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${emp.name.charAt(0)}`} alt={emp.name} data-ai-hint="person avatar" />
                              <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{emp.department || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{format(new Date(emp.clockInTime), 'hh:mm a', { timeZone: IST_TIMEZONE })}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Absent Today ({dashboardData?.absentEmployees.length || 0})</CardTitle>
            <CardDescription>Employees who have not clocked in.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.absentEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        All employees are accounted for.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboardData?.absentEmployees.map(emp => (
                      <TableRow key={emp._id} onClick={() => handleRowClick(emp._id)} className="cursor-pointer">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${emp.name.charAt(0)}`} alt={emp.name} data-ai-hint="person avatar" />
                              <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{emp.department || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={emp.leaveType ? 'outline' : 'destructive'}>
                            {emp.leaveType ? `On Leave (${emp.leaveType})` : 'Absent'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
