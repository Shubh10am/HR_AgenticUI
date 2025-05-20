
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, UserCircle, Clock, LogIn, LogOut, Briefcase } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";

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

export default function AttendanceReportingPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    const now = new Date();
    setIsClockedIn(true);
    setClockInTime(now);
    toast({
      title: "Clocked In",
      description: `You clocked in at ${now.toLocaleTimeString()}.`,
    });
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    // Here you would typically save the clock-out time to a backend
    toast({
      title: "Clocked Out",
      description: `You clocked out at ${new Date().toLocaleTimeString()}.`,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'default'; // Uses primary color by default
      case 'absent':
        return 'destructive';
      case 'late':
        return 'secondary'; // Uses accent or secondary for late
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
  }


  return (
    <>
      <PageHeader
        title="Attendance & Reporting"
        description="Manage attendance, view reports, and track productivity."
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Clock className="mr-2 h-6 w-6 text-primary" />
              Clock In/Out
            </CardTitle>
            <CardDescription>Your current time: {currentTime}</CardDescription>
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

        <Card className="md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
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
                  {attendanceData.slice(0, 5).map((entry) => ( // Show limited entries for brevity
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
      </div>
      
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

    