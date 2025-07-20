
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, PauseCircle, Activity, BarChart2 } from 'lucide-react';
import type { OrganizationStatus } from '@/models/Organization';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';


interface EmployeeDetails {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    createdAt: string;
    organization: {
        name: string;
        status: OrganizationStatus;
    }
}

interface AttendanceRecord {
    date: string;
    status: string;
    hoursWorked: number; // in minutes
}

interface EmployeeDetailResponse {
    employee: EmployeeDetails;
    attendance: AttendanceRecord[];
}

const chartConfig = {
  hours: {
    label: "Hours Worked",
    color: "hsl(var(--chart-1))",
  },
} satisfies import('@/components/ui/chart').ChartConfig;


export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [details, setDetails] = useState<EmployeeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('7d');

  const fetchEmployeeDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication required.');

      const response = await fetch(`/api/employees/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employee details');
      }

      const data: EmployeeDetailResponse = await response.json();
      setDetails(data);
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
  }, [id, toast]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [fetchEmployeeDetails]);
  
  const filteredAttendanceData = useMemo(() => {
    if (!details?.attendance) return [];

    const now = new Date();
    let startDate = new Date();

    if (timeframe === '7d') startDate.setDate(now.getDate() - 7);
    else if (timeframe === '14d') startDate.setDate(now.getDate() - 14);
    else if (timeframe === '30d') startDate.setMonth(now.getMonth() - 1);
    
    return details.attendance
      .filter(record => new Date(record.date) >= startDate)
      .map(record => ({
        date: format(parseISO(record.date), 'MMM d'),
        hours: (record.hoursWorked / 60).toFixed(1),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [details, timeframe]);


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
        <p className="ml-2">Loading employee details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-destructive font-semibold">Failed to load employee details</p>
        <p className="text-sm text-destructive/80">{error || 'Employee data is not available.'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/manage-employees">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employee List
          </Link>
        </Button>
      </div>
    );
  }
  
  const { employee, attendance } = details;

  return (
    <>
      <PageHeader title={employee.name} description={`Profile and activity for ${employee.email}`}>
        <Button variant="outline" onClick={() => router.push('/manage-employees')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </PageHeader>
      
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
            <CardHeader><CardTitle>Role</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{employee.role}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Department</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-bold">{employee.department || 'N/A'}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
            <CardContent><p className="text-lg font-medium">{employee.organization.name}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Org Status</CardTitle></CardHeader>
            <CardContent>{getStatusComponent(employee.organization.status)}</CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary" /> Attendance Overview</CardTitle>
              <CardDescription>Hours worked over the selected period.</CardDescription>
            </div>
             <div className="flex gap-1 bg-muted p-1 rounded-md">
                <Button size="sm" variant={timeframe === '7d' ? 'secondary' : 'ghost'} onClick={() => setTimeframe('7d')}>7 Days</Button>
                <Button size="sm" variant={timeframe === '14d' ? 'secondary' : 'ghost'} onClick={() => setTimeframe('14d')}>14 Days</Button>
                <Button size="sm" variant={timeframe === '30d' ? 'secondary' : 'ghost'} onClick={() => setTimeframe('30d')}>30 Days</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={filteredAttendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-hours)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-hours)" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area type="monotone" dataKey="hours" stroke="var(--color-hours)" fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}
