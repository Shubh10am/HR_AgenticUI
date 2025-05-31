
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, UserCircle, Clock, LogIn, LogOut, Briefcase, CalendarDays, Send, FileText, BarChartHorizontalBig, Edit, Filter, UserSearch, XCircle, Wand2, Loader2 as LoaderIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInMinutes, parse, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput, type GenerateDraftEmailResponsesOutput } from '@/ai/flows/draft-email-response';


interface AttendanceEntry {
  id: string;
  employee: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'On Leave' | 'No Check-in';
  clockIn?: string;
  clockOut?: string;
  hoursWorked?: string;
  department: string;
}

const initialAttendanceData: AttendanceEntry[] = [
  { id: '1', employee: 'John Doe', date: '2024-07-01', status: 'Present', clockIn: '09:00 AM', clockOut: '05:30 PM', hoursWorked: '8h 30m', department: 'Engineering' },
  { id: '2', employee: 'John Doe', date: '2024-07-02', status: 'Present', clockIn: '09:05 AM', clockOut: '05:35 PM', hoursWorked: '8h 30m', department: 'Engineering' },
  { id: '3', employee: 'John Doe', date: '2024-07-03', status: 'Absent', hoursWorked: '0h 0m', department: 'Engineering' },
  { id: '4', employee: 'Jane Smith', date: '2024-07-03', status: 'Present', clockIn: '09:00 AM', clockOut: '05:00 PM', hoursWorked: '8h 0m', department: 'Marketing' },
  { id: '5', employee: 'John Doe', date: '2024-07-04', status: 'Late', clockIn: '09:45 AM', clockOut: '06:00 PM', hoursWorked: '8h 15m', department: 'Engineering' },
  { id: '6', employee: 'John Doe', date: '2024-07-05', status: 'Present', clockIn: '08:55 AM', clockOut: '05:25 PM', hoursWorked: '8h 30m', department: 'Engineering' },
  { id: '7', employee: 'Alice Brown', date: '2024-07-05', status: 'On Leave', hoursWorked: 'N/A', department: 'Sales' },
  { id: '8', employee: 'Bob Green', date: '2024-07-05', status: 'No Check-in', hoursWorked: '0h 0m', department: 'Support' },
  { id: '9', employee: 'Jane Smith', date: '2024-07-01', status: 'Present', clockIn: '09:00 AM', clockOut: '05:00 PM', hoursWorked: '8h 0m', department: 'Marketing' },
  { id: '10', employee: 'Alice Brown', date: '2024-07-02', status: 'Late', clockIn: '09:30 AM', clockOut: '05:30 PM', hoursWorked: '8h 0m', department: 'Sales' },
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
  const [lastClockInTimeDisplay, setLastClockInTimeDisplay] = useState<string | null>(null);
  const { toast } = useToast();

  const [filterEmployeeName, setFilterEmployeeName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [displayedAttendanceData, setDisplayedAttendanceData] = useState<AttendanceEntry[]>(initialAttendanceData);

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest>({
    employeeName: 'John Doe', 
    leaveType: '',
    startDate: undefined,
    endDate: undefined,
    reason: '',
  });

  const [isLeaveReasonPopoverOpen, setIsLeaveReasonPopoverOpen] = useState(false);
  const [leaveReasonPrompt, setLeaveReasonPrompt] = useState('');
  const [isGeneratingLeaveReason, setIsGeneratingLeaveReason] = useState(false);


  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    const storedClockInStatus = localStorage.getItem('hrStreamlineClockInStatus');
    const storedClockInTime = localStorage.getItem('hrStreamlineClockInTime');
    if (storedClockInStatus === 'true' && storedClockInTime) {
      const time = new Date(storedClockInTime);
      setIsClockedIn(true);
      setClockInTime(time);
      setLastClockInTimeDisplay(time.toLocaleTimeString());
    }
    setDisplayedAttendanceData(initialAttendanceData);
    return () => clearInterval(timerId);
  }, []);

  const handleClockIn = () => {
    const now = new Date();
    setIsClockedIn(true);
    setClockInTime(now);
    setLastClockInTimeDisplay(now.toLocaleTimeString());
    localStorage.setItem('hrStreamlineClockInStatus', 'true');
    localStorage.setItem('hrStreamlineClockInTime', now.toISOString());
    toast({
      title: "Clocked In",
      description: `You clocked in at ${now.toLocaleTimeString()}.`,
    });
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    const clockOutTime = new Date();
    let durationMessage = '';
    if (clockInTime) {
      const minutes = differenceInMinutes(clockOutTime, clockInTime);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      durationMessage = ` Session duration: ${hours}h ${remainingMinutes}m.`;
    }
    
    localStorage.removeItem('hrStreamlineClockInStatus');
    localStorage.removeItem('hrStreamlineClockInTime');
    setClockInTime(null); 
    toast({
      title: "Clocked Out",
      description: `You clocked out at ${clockOutTime.toLocaleTimeString()}.${durationMessage}`,
    });
  };

  const getStatusBadgeVariant = (status: AttendanceEntry['status']) => {
    switch (status.toLowerCase()) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      case 'on leave': return 'outline';
      case 'no check-in': return 'outline';
      default: return 'outline';
    }
  };
  
  const getStatusBadgeClassName = (status: AttendanceEntry['status']) => {
    switch (status.toLowerCase()) {
      case 'present': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'late': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'on leave': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'no check-in': return 'bg-orange-500 hover:bg-orange-600 text-white';
      default: return '';
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
      description: `Request for ${leaveRequest.leaveType} leave from ${format(leaveRequest.startDate as Date, 'PPP')} to ${format(leaveRequest.endDate as Date, 'PPP')} has been submitted.`,
    });
    setLeaveRequest({
      employeeName: 'John Doe',
      leaveType: '',
      startDate: undefined,
      endDate: undefined,
      reason: '',
    });
    setLeaveReasonPrompt('');
  };

  const handleGenerateLeaveReason = async () => {
    if (!leaveReasonPrompt.trim()) {
      toast({ title: "Prompt Required", description: "Please enter a prompt for the leave reason.", variant: "destructive" });
      return;
    }
    setIsGeneratingLeaveReason(true);
    try {
      const aiInput: GenerateDraftEmailResponsesInput = { 
        query: `Generate a concise and professional reason for a leave request based on the following information: "${leaveReasonPrompt}". The reason should be suitable for an official leave application. Do not include a subject line or any greetings/closings, just the reason text itself.` 
      };
      const result = await generateDraftEmailResponses(aiInput);
      if (result.drafts && result.drafts.length > 0) {
        handleLeaveRequestChange('reason', result.drafts[0].body);
        toast({ title: "Leave Reason Generated", description: "The reason field has been populated." });
        setIsLeaveReasonPopoverOpen(false);
        setLeaveReasonPrompt(''); 
      } else {
        toast({ title: "Generation Failed", description: "Could not generate a leave reason. Please try again or write manually.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error generating leave reason:", error);
      toast({ title: "Error", description: "An error occurred while generating the leave reason.", variant: "destructive" });
    } finally {
      setIsGeneratingLeaveReason(false);
    }
  };


  const handleApplyFilters = () => {
    let filteredData = [...initialAttendanceData];

    if (filterEmployeeName.trim() !== '') {
      filteredData = filteredData.filter(entry =>
        entry.employee.toLowerCase().includes(filterEmployeeName.trim().toLowerCase())
      );
    }

    if (filterStartDate) {
      const sDate = startOfDay(filterStartDate);
      filteredData = filteredData.filter(entry => {
        try {
          const entryDate = parse(entry.date, 'yyyy-MM-dd', new Date());
          return isEqual(entryDate, sDate) || isAfter(entryDate, sDate);
        } catch (e) { return true; } 
      });
    }

    if (filterEndDate) {
      const eDate = startOfDay(filterEndDate);
      filteredData = filteredData.filter(entry => {
        try {
          const entryDate = parse(entry.date, 'yyyy-MM-dd', new Date());
          return isEqual(entryDate, eDate) || isBefore(entryDate, eDate);
        } catch (e) { return true; }
      });
    }
    setDisplayedAttendanceData(filteredData);
    toast({
      title: "Filters Applied",
      description: `Showing ${filteredData.length} matching records.`,
    });
  };

  const handleClearFilters = () => {
    setFilterEmployeeName('');
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setDisplayedAttendanceData(initialAttendanceData);
    toast({
        title: "Filters Cleared",
        description: "Showing all attendance records."
    });
  };

  const triggerDownload = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadCsv = () => {
    if (displayedAttendanceData.length === 0) {
      toast({ title: "No Data", description: "No data to download.", variant: "destructive" });
      return;
    }
    const header = "Employee,Date,Status,Clock In,Clock Out,Hours Worked,Department\n";
    const rows = displayedAttendanceData.map(entry => 
      `"${entry.employee}","${entry.date}","${entry.status}","${entry.clockIn || '-'}","${entry.clockOut || '-'}","${entry.hoursWorked || '-'}","${entry.department}"`
    ).join("\n");
    const csvContent = header + rows;
    triggerDownload(csvContent, 'attendance_report.csv', 'text/csv;charset=utf-8;');
    toast({ title: "CSV Downloaded", description: "Attendance report CSV has been downloaded." });
  };

  const handleDownloadPdfMock = () => { 
    if (displayedAttendanceData.length === 0) {
      toast({ title: "No Data", description: "No data to download for text report.", variant: "destructive" });
      return;
    }
    let textContent = "Attendance Report (Mock PDF - Text Version)\n";
    textContent += "===========================================\n\n";
    displayedAttendanceData.forEach(entry => {
      textContent += `Employee: ${entry.employee}\n`;
      textContent += `Date: ${entry.date}\n`;
      textContent += `Status: ${entry.status}\n`;
      textContent += `Clock In: ${entry.clockIn || '-'}\n`;
      textContent += `Clock Out: ${entry.clockOut || '-'}\n`;
      textContent += `Hours Worked: ${entry.hoursWorked || '-'}\n`;
      textContent += `Department: ${entry.department}\n`;
      textContent += "-------------------------------------------\n";
    });
    triggerDownload(textContent, 'attendance_report_text_version.txt', 'text/plain;charset=utf-8;');
    toast({ title: "Text Report Downloaded", description: "A text version of the attendance report has been downloaded." });
  };


  return (
    <>
      <PageHeader
        title="Attendance & Reporting"
        description="Manage attendance, view reports, request leave, and track productivity."
      >
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={handleDownloadPdfMock}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF (Mock)
          </Button>
          <Button variant="outline" onClick={handleDownloadCsv}>
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
                {lastClockInTimeDisplay && <p className="text-sm text-muted-foreground">Since: {lastClockInTimeDisplay}</p>}
              </div>
            ) : (
              <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">You are Clocked Out</p>
                 {lastClockInTimeDisplay && !isClockedIn && <p className="text-sm text-muted-foreground">Last clocked in: {lastClockInTimeDisplay}</p>}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="reason">Reason</Label>
                  <Popover open={isLeaveReasonPopoverOpen} onOpenChange={setIsLeaveReasonPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-2 py-1 h-auto">
                        <Wand2 className="h-4 w-4 text-primary" />
                        <span className="sr-only">Generate reason with AI</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 space-y-2">
                        <Label htmlFor="leaveReasonPrompt" className="text-sm font-medium">AI Prompt for Leave Reason</Label>
                        <Textarea 
                          id="leaveReasonPrompt"
                          value={leaveReasonPrompt}
                          onChange={(e) => setLeaveReasonPrompt(e.target.value)}
                          placeholder="e.g., family event, doctor visit"
                          className="min-h-[60px] text-xs"
                        />
                        <Button 
                          onClick={handleGenerateLeaveReason} 
                          disabled={isGeneratingLeaveReason || !leaveReasonPrompt.trim()} 
                          className="w-full"
                          size="sm"
                        >
                          {isGeneratingLeaveReason ? <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                          Generate
                        </Button>
                    </PopoverContent>
                  </Popover>
                </div>
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
              <Badge variant="outline" className="bg-blue-500 text-white">1 Day (Sick)</Badge>
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
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <UserCircle className="h-10 w-10 text-primary mr-3" />
                <div>
                  <CardTitle className="text-xl">Employee Attendance Overview</CardTitle>
                  <CardDescription>Monthly attendance summary for all employees.</CardDescription>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <CardTitle className="text-lg mb-2 flex items-center"><Filter className="mr-2 h-5 w-5" /> Filter Records</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2">
                  <Label htmlFor="filterEmployeeName">Employee Name</Label>
                  <Input 
                    id="filterEmployeeName"
                    value={filterEmployeeName}
                    onChange={(e) => setFilterEmployeeName(e.target.value)}
                    placeholder="Search by name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="filterStartDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="filterStartDate" variant={"outline"} className="w-full justify-start text-left font-normal mt-1">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {filterStartDate ? format(filterStartDate, "PPP") : <span>Pick a start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={filterStartDate} onSelect={setFilterStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="filterEndDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="filterEndDate" variant={"outline"} className="w-full justify-start text-left font-normal mt-1">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {filterEndDate ? format(filterEndDate, "PPP") : <span>Pick an end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={filterEndDate} onSelect={setFilterEndDate} disabled={(date) => filterStartDate ? date < filterStartDate : false} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handleApplyFilters} className="flex-1">
                    <UserSearch className="mr-2 h-4 w-4" /> Apply
                    </Button>
                    <Button onClick={handleClearFilters} variant="outline" className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" /> Clear
                    </Button>
                </div>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours Worked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAttendanceData.length > 0 ? displayedAttendanceData.map((entry) => ( 
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
                    <TableCell>{entry.clockIn || '-'}</TableCell>
                    <TableCell>{entry.clockOut || '-'}</TableCell>
                    <TableCell>{entry.hoursWorked || '-'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No attendance records match your filters.
                    </TableCell>
                  </TableRow>
                )}
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

