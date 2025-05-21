
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, UserCircle, Clock, LogIn, LogOut, Briefcase, CalendarDays, Send, FileText, BarChartHorizontalBig, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const attendanceData = [
  { id: '1', employee: 'John Doe', date: '2024-07-01', status: 'Present', clockIn: '09:00 AM', clockOut: '05:30 PM', department: 'Engineering' },
  { id: '2', employee: 'John Doe', date: '2024-07-02', status: 'Present', clockIn: '09:05 AM', clockOut: '05:35 PM', department: 'Engineering' },
  { id: '3', employee: 'John Doe', date: '2024-07-03', status: 'Absent', clockIn: '-', clockOut: '-', department: 'Engineering' },
  { id: '4', employee: 'Jane Smith', date: '2024-07-03', status: 'Present', clockIn: '09:00 AM', clockOut: '05:00 PM', department: 'Marketing' },
  { id: '5', employee: 'John Doe', date: '2024-07-04', status: 'Late', clockIn: '09:45 AM', clockOut: '06:00 PM', department: 'Engineering' },
  { id: '6', employee: 'John Doe', date: '2024-07-05', status: 'Present', clockIn: '08:55 AM', clockOut: '05:25 PM', department: 'Engineering' },
];

const productivityData = [
    { employee: 'John Doe', tasksCompleted: 15, targetTasks: 12, project: 'Project Phoenix', rating: 'High' },
    { employee: 'Jane Smith', tasksCompleted: 10, targetTasks: 10, project: 'Campaign Alpha', rating: 'Met Expectations' },
];

interface LeaveRequest {
  employeeName: string;
  leaveType: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  reason: string;
}

export default function AttendanceReportingPage() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest>({
    employeeName: 'John Doe', // Mock prefill
    leaveType: '',
    startDate: undefined,
    endDate: undefined,
    reason: '',
  });

  useEffect(() => {
    // Set initial time on client mount
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Attempt to retrieve clock-in state from localStorage
    const storedClockInStatus = localStorage.getItem('clockInStatus');
    const storedClockInTime = localStorage.getItem('clockInTime');
    if (storedClockInStatus === 'true' && storedClockInTime) {
      setIsClockedIn(true);
      setClockInTime(new Date(storedClockInTime));
    }
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    const now = new Date();
    setIsClockedIn(true);
    setClockInTime(now);
    localStorage.setItem('clockInStatus', 'true');
    localStorage.setItem('clockInTime', now.toISOString());
    toast({
      title: "Clocked In",
      description: `You clocked in at ${now.toLocaleTimeString()}.`,
    });
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    localStorage.removeItem('clockInStatus');
    localStorage.removeItem('clockInTime');
    // Here you would typically save the clock-out time to a backend
    toast({
      title: "Clocked Out",
      description: `You clocked out at ${new Date().toLocaleTimeString()}.`,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'default';
      case 'absent':
        return 'destructive';
      case 'late':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getStatusBadgeClassName = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-500 hover:bg-green-600 text-white'; 
      case 'late':
        return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      default:
        return '';
    }
  };

  const handleLeaveRequestChange = (field: keyof LeaveRequest, value: string | Date | undefined) => {
    setLeaveRequest(prev => ({ ...prev, [field]: value }));
  };

  const handleLeaveSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leaveRequest.employeeName || !leaveRequest.leaveType || !leaveRequest.startDate || !leaveRequest.endDate || !leaveRequest.reason) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all fields for the leave request.",
        variant: "destructive",
      });
      return;
    }
    console.log("Leave Request Submitted:", leaveRequest);
    toast({
      title: "Leave Request Submitted (Mock)",
      description: `Request for ${leaveRequest.leaveType} leave from ${format(leaveRequest.startDate, 'PPP')} to ${format(leaveRequest.endDate, 'PPP')} has been submitted.`,
    });
    // Reset form (optional)
    setLeaveRequest({
      employeeName: 'John Doe',
      leaveType: '',
      startDate: undefined,
      endDate: undefined,
      reason: '',
    });
  };

  return (
    <>
      <PageHeader
        title="Attendance & Reporting"
        description="Manage attendance, view reports, request leave, and track productivity."
      >
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Clock className="mr-2 h-6 w-6 text-primary" />
              Clock In/Out
            </CardTitle>
            <CardDescription>Your current time: {currentTime !== null ? currentTime : 'Loading...'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isClockedIn ? (
              <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-md">
                <p className="font-semibold text-green-700 dark:text-green-400">You are Clocked In</p>
                {clockInTime && <p className="text-sm text-muted-foreground">Since: {clockInTime.toLocaleTimeString()}</p>}
              </div>
            ) : (
              <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">You are Clocked Out</p>
              </div>
            )}
            {!isClockedIn ? (
              <Button onClick={handleClockIn} className="w-full" size="lg">
                <LogIn className="mr-2 h-5 w-5" /> Clock In
              </Button>
            ) : (
              <Button onClick={handleClockOut} variant="destructive" className="w-full" size="lg">
                <LogOut className="mr-2 h-5 w-5" /> Clock Out
              </Button>
            )}
             <p className="text-xs text-muted-foreground text-center">
              Remember to clock in when you start and clock out when you finish your workday.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Edit className="mr-2 h-6 w-6 text-primary" />
              Request Leave
            </CardTitle>
            <CardDescription>Submit a new leave application.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input id="employeeName" value={leaveRequest.employeeName} onChange={(e) => handleLeaveRequestChange('employeeName', e.target.value)} placeholder="Your Name" required />
              </div>
              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={leaveRequest.leaveType} onValueChange={(value) => handleLeaveRequestChange('leaveType', value)}>
                  <SelectTrigger id="leaveType">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual">Annual Leave</SelectItem>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {leaveRequest.startDate ? format(leaveRequest.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={leaveRequest.startDate}
                        onSelect={(date) => handleLeaveRequestChange('startDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {leaveRequest.endDate ? format(leaveRequest.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={leaveRequest.endDate}
                        onSelect={(date) => handleLeaveRequestChange('endDate', date)}
                        disabled={(date) =>
                          leaveRequest.startDate ? date < leaveRequest.startDate : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" value={leaveRequest.reason} onChange={(e) => handleLeaveRequestChange('reason', e.target.value)} placeholder="Briefly state the reason for your leave" required />
              </div>
              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" /> Submit Leave Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
           <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" />
              John Doe's Monthly Snapshot
            </CardTitle>
            <CardDescription>Your attendance summary for July 2024 (Mock).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium">Total Present</span>
              <Badge variant="default" className="bg-green-500 text-white">20 Days</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium">Total Absent</span>
              <Badge variant="destructive">2 Days</Badge>
            </div>
             <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium">Late Marks</span>
              <Badge variant="secondary" className="bg-yellow-500 text-black">3 Occasions</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium">Leaves Taken</span>
              <Badge variant="outline">1 Day (Sick)</Badge>
            </div>
          </CardContent>
        </Card>
         <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileText className="mr-2 h-6 w-6 text-primary" />
              Company Attendance Policy
            </CardTitle>
            <CardDescription>Key highlights of our attendance policy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Working Hours:</strong> Standard working hours are 9:00 AM to 5:30 PM, Monday to Friday.</p>
            <p><strong>Late Policy:</strong> Arrival after 9:15 AM is considered late. More than 3 late marks in a month may affect performance reviews.</p>
            <p><strong>Leave Application:</strong> All leaves must be applied for at least 3 days in advance, except for emergencies. Sick leave requires a medical certificate for absences longer than 2 days.</p>
            <p><strong>Breaks:</strong> A total of 1 hour break (lunch and tea) is permitted during the workday.</p>
            <p className="text-xs italic">This is a summary. Please refer to the employee handbook for the complete attendance policy.</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
           <div className="flex items-center space-x-3">
              <UserCircle className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="text-xl">Employee Attendance Overview</CardTitle>
                <CardDescription>Monthly attendance summary for all employees.</CardDescription>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.slice(0, 5).map((entry) => ( 
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.employee}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(entry.status)}
                        className={getStatusBadgeClassName(entry.status)}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.clockIn}</TableCell>
                    <TableCell>{entry.clockOut}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Briefcase className="mr-2 h-6 w-6 text-primary" />
            Productivity & Behavior Reports
          </CardTitle>
          <CardDescription>Individual monthly productivity and behavior summaries.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {productivityData.map(data => (
              <Card key={data.employee} className="bg-card border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{data.employee}</CardTitle>
                  <CardDescription>{data.project}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tasks Completed:</span>
                      <span className="font-semibold">{data.tasksCompleted} / {data.targetTasks}</span>
                    </div>
                    <Progress value={(data.tasksCompleted / data.targetTasks) * 100} className="h-2" />
                  </div>
                  <p className="text-sm"><span className="font-medium">Rating:</span> {data.rating}</p>
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    {data.employee === 'John Doe' ? 
                     "Consistently demonstrates strong teamwork and proactive problem-solving. Key contributions to Project Phoenix." :
                     "Met expectations for Campaign Alpha. Good collaboration skills."
                    }
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
