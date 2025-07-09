'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import Link from 'next/link'; // Added Link
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, UserCircle, Clock, LogIn, LogOut, Briefcase, CalendarDays, Send, FileText, BarChartHorizontalBig, Edit, Filter, UserSearch, XCircle, Wand2, Loader2 as LoaderIcon, AlertTriangle, UserPlus, ShieldQuestion } from 'lucide-react'; // Added UserPlus, ShieldQuestion
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse, isAfter, isBefore, isEqual, startOfDay, startOfMonth } from 'date-fns';
import { generateDraftEmailResponses, type GenerateDraftEmailResponsesInput } from '@/ai/flows/draft-email-response';
import { useAuth } from '@/contexts/auth-context';
import type { TransformedAttendanceRecord } from '@/pages/api/attendance/records';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface AttendanceEntry {
  id: string;
  employee: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'On Leave' | 'No Check-in' | 'EarlyDeparture' | 'Unknown';
  clockIn?: string;
  clockOut?: string;
  hoursWorked?: string;
  department?: string;
}

const mockCalendarAttendanceData: AttendanceEntry[] = [
  { id: 'cal-1', employee: 'John Doe', date: '2024-07-01', status: 'Present', clockIn: '09:00 AM', clockOut: '05:30 PM', hoursWorked: '8h 30m', department: 'Engineering' },
  { id: 'cal-2', employee: 'John Doe', date: '2024-07-02', status: 'Present', clockIn: '09:05 AM', clockOut: '05:35 PM', hoursWorked: '8h 30m', department: 'Engineering' },
  { id: 'cal-3', employee: 'John Doe', date: '2024-07-03', status: 'Absent', hoursWorked: '0h 0m', department: 'Engineering' },
  { id: 'cal-4', employee: 'Jane Smith', date: '2024-07-03', status: 'Present', clockIn: '09:00 AM', clockOut: '05:00 PM', hoursWorked: '8h 0m', department: 'Marketing' },
  { id: 'cal-5', employee: 'John Doe', date: '2024-07-04', status: 'Late', clockIn: '09:45 AM', clockOut: '06:00 PM', hoursWorked: '8h 15m', department: 'Engineering' },
  { id: 'cal-6', employee: 'John Doe', date: '2024-07-05', status: 'Present', clockIn: '08:55 AM', clockOut: '05:25 PM', hoursWorked: '8h 30m', department: 'Engineering' },
  { id: 'cal-7', employee: 'Alice Brown', date: '2024-07-05', status: 'On Leave', hoursWorked: 'N/A', department: 'Sales' },
  { id: 'cal-8', employee: 'Bob Green', date: '2024-07-05', status: 'No Check-in', hoursWorked: '0h 0m', department: 'Support' },
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
  const { user, token } = useAuth();

  const isGuest = user?.organizationId === 'guest-org-id' || (token && token.startsWith('guest-'));

  const [filterEmployeeName, setFilterEmployeeName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  
  const [allFetchedAttendanceRecords, setAllFetchedAttendanceRecords] = useState<AttendanceEntry[]>([]);
  const [displayedAttendanceData, setDisplayedAttendanceData] = useState<AttendanceEntry[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);


  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest>({
    employeeName: user?.name || '', 
    leaveType: '',
    startDate: undefined,
    endDate: undefined,
    reason: '',
  });

  const [isLeaveReasonPopoverOpen, setIsLeaveReasonPopoverOpen] = useState(false);
  const [leaveReasonPrompt, setLeaveReasonPrompt] = useState('');
  const [isGeneratingLeaveReason, setIsGeneratingLeaveReason] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [isClocking, setIsClocking] = useState(false);


  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(startOfMonth(new Date()));
  const [dayModifiers, setDayModifiers] = useState<Record<string, Date[]>>({});
  const [dayModifiersClassNames, setDayModifiersClassNames] = useState<Record<string, string>>({});

  const fetchAttendanceRecords = useCallback(async () => {
    if (!token || isGuest) return; // Do not fetch for guests
    setIsLoadingRecords(true);
    setFetchError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/records`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendance records');
      }
      const data: TransformedAttendanceRecord[] = await response.json();
      
      const mappedData: AttendanceEntry[] = data.map(record => ({
        id: record.id,
        employee: record.employeeName,
        date: record.date,
        status: record.status, 
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        hoursWorked: record.hoursWorked,
        department: record.department,
      }));
      setAllFetchedAttendanceRecords(mappedData);
      setDisplayedAttendanceData(mappedData); 

    } catch (error: any) {
      console.error("Error fetching attendance records:", error);
      toast({ title: "Fetch Error", description: error.message, variant: "destructive" });
      setFetchError(error.message);
      setAllFetchedAttendanceRecords([]);
      setDisplayedAttendanceData([]);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [token, toast, isGuest]);

  useEffect(() => {
    if (isGuest) {
      setIsLoadingRecords(false);
      setFetchError(null);
      setAllFetchedAttendanceRecords([]);
      setDisplayedAttendanceData([]);
    } else {
      fetchAttendanceRecords();
    }
  }, [fetchAttendanceRecords, isGuest]);


  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    if (!isGuest) {
        const storedClockInStatus = localStorage.getItem('hrStreamlineClockInStatus');
        const storedClockInTime = localStorage.getItem('hrStreamlineClockInTime');
        if (storedClockInStatus === 'true' && storedClockInTime) {
          const time = new Date(storedClockInTime);
          setIsClockedIn(true);
          setClockInTime(time);
          setLastClockInTimeDisplay(time.toLocaleTimeString());
        }
    } else {
        setIsClockedIn(false);
        setClockInTime(null);
        setLastClockInTimeDisplay(null);
    }

    if (user?.name && !leaveRequest.employeeName) {
        setLeaveRequest(prev => ({...prev, employeeName: user.name}));
    }

    const presentDays = mockCalendarAttendanceData
      .filter(d => d.status === 'Present')
      .map(d => parse(d.date, 'yyyy-MM-dd', new Date()));
    const absentDays = mockCalendarAttendanceData
      .filter(d => d.status === 'Absent')
      .map(d => parse(d.date, 'yyyy-MM-dd', new Date()));
    const lateDays = mockCalendarAttendanceData
      .filter(d => d.status === 'Late')
      .map(d => parse(d.date, 'yyyy-MM-dd', new Date()));
    const onLeaveDays = mockCalendarAttendanceData
      .filter(d => d.status === 'On Leave')
      .map(d => parse(d.date, 'yyyy-MM-dd', new Date()));
    const noCheckInDays = mockCalendarAttendanceData
      .filter(d => d.status === 'No Check-in')
      .map(d => parse(d.date, 'yyyy-MM-dd', new Date()));
      
    setDayModifiers({
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      onLeave: onLeaveDays,
      noCheckIn: noCheckInDays,
    });

    setDayModifiersClassNames({
      present: 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 rounded-md',
      absent: 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 rounded-md',
      late: 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-700 dark:text-yellow-300 rounded-md',
      onLeave: 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-md',
      noCheckIn: 'bg-orange-100 dark:bg-orange-800/50 text-orange-700 dark:text-orange-300 rounded-md',
    });

    return () => clearInterval(timerId);
  }, [user, isGuest]);

  const handleClockIn = async () => {
    if (isGuest) {
        toast({ title: "Guest Mode", description: "Please log in or register to use clock-in.", variant: "default" });
        return;
    }
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    setIsClocking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clock in.');
      }
      
      const now = new Date(data.record.clockInTime);
      setIsClockedIn(true);
      setClockInTime(now);
      setLastClockInTimeDisplay(now.toLocaleTimeString());
      localStorage.setItem('hrStreamlineClockInStatus', 'true');
      localStorage.setItem('hrStreamlineClockInTime', now.toISOString());
      toast({
        title: "Clocked In",
        description: `You clocked in at ${now.toLocaleTimeString()}.`,
      });
      fetchAttendanceRecords(); 
    } catch (error: any) {
      toast({ title: "Clock-In Error", description: error.message, variant: "destructive" });
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    if (isGuest) {
        toast({ title: "Guest Mode", description: "Please log in or register to use clock-out.", variant: "default" });
        return;
    }
     if (!token) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    setIsClocking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/clock-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clock out.');
      }

      setIsClockedIn(false);
      const clockOutTime = new Date(data.record.clockOutTime);
      let durationMessage = '';
      if (data.record.hoursWorked !== undefined) {
        const minutes = data.record.hoursWorked;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        durationMessage = ` Session duration: ${hours}h ${remainingMinutes}m.`;
      }
      
      localStorage.removeItem('hrStreamlineClockInStatus');
      localStorage.removeItem('hrStreamlineClockInTime');
      toast({
        title: "Clocked Out",
        description: `You clocked out at ${clockOutTime.toLocaleTimeString()}.${durationMessage}`,
      });
      fetchAttendanceRecords(); 
    } catch (error: any) {
      toast({ title: "Clock-Out Error", description: error.message, variant: "destructive" });
    } finally {
      setIsClocking(false);
    }
  };

  const getStatusBadgeVariant = (status?: AttendanceEntry['status']) => {
    if (!status) return 'outline';
    switch (status.toLowerCase()) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      case 'on leave': return 'outline';
      case 'no check-in': return 'outline';
      case 'earlydeparture': return 'secondary';
      default: return 'outline';
    }
  };
  
  const getStatusBadgeClassName = (status?: AttendanceEntry['status']) => {
     if (!status) return '';
    switch (status.toLowerCase()) {
      case 'present': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'late': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'on leave': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'no check-in': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'earlydeparture': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      default: return '';
    }
  };

  const handleLeaveRequestChange = (field: keyof LeaveRequest, value: string | Date | undefined) => {
    setLeaveRequest(prev => ({ ...prev, [field]: value }));
  };

  const handleLeaveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isGuest) {
        toast({ title: "Guest Mode", description: "Please log in or register to submit leave requests.", variant: "default" });
        return;
    }
    if (!token) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (!leaveRequest.employeeName || !leaveRequest.leaveType || !leaveRequest.startDate || !leaveRequest.endDate || !leaveRequest.reason) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all fields for the leave request.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingLeave(true);
    try {
      const payload = {
        ...leaveRequest,
        startDate: leaveRequest.startDate?.toISOString(),
        endDate: leaveRequest.endDate?.toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/api/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit leave request.');
      }
      
      toast({
        title: "Leave Request Submitted",
        description: `Request for ${leaveRequest.leaveType} leave from ${format(leaveRequest.startDate as Date, 'PPP')} to ${format(leaveRequest.endDate as Date, 'PPP')} has been submitted.`,
      });
      setLeaveRequest({
        employeeName: user?.name || '',
        leaveType: '',
        startDate: undefined,
        endDate: undefined,
        reason: '',
      });
      setLeaveReasonPrompt('');
    } catch (error: any) {
      toast({ title: "Leave Request Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleGenerateLeaveReason = async () => {
    if (isGuest) {
        toast({ title: "Guest Mode", description: "AI features are limited for guests. Please log in.", variant: "default" });
        return;
    }
    if (!leaveReasonPrompt.trim()) {
      toast({ title: "Prompt Required", description: "Please enter a prompt for the leave reason.", variant: "destructive" });
      return;
    }
    setIsGeneratingLeaveReason(true);
    try {
      const userApiKey = localStorage.getItem('userApiKey');
      const aiInput: GenerateDraftEmailResponsesInput = { 
        query: `Please write a concise and professional reason for a leave application based on the following input: ${leaveReasonPrompt}. Also provide a suitable subject line for this reason.`,
        apiKey: userApiKey,
      };
      const result = await generateDraftEmailResponses(aiInput);
      
      console.log("AI Response for leave reason:", JSON.stringify(result, null, 2));

      if (result.drafts && result.drafts.length > 0 && typeof result.drafts[0].body === 'string' && result.drafts[0].body.trim() !== '') {
        const trimmedBody = result.drafts[0].body.trim();
        console.log(`Populating reason field with: "${trimmedBody}"`);
        handleLeaveRequestChange('reason', trimmedBody);
        toast({ title: "Leave Reason Generated", description: "The reason field has been populated." });
        setIsLeaveReasonPopoverOpen(false);
        setLeaveReasonPrompt(''); 
      } else {
        toast({ 
            title: "Generation Failed", 
            description: "Could not generate a leave reason. Please try again or write manually. Check console for AI response details.", 
            variant: "destructive",
            duration: 7000,
        });
      }
    } catch (error) {
      console.error("Error generating leave reason:", error);
      toast({ title: "AI Error", description: "An error occurred while communicating with the AI. Please check console.", variant: "destructive" });
    } finally {
      setIsGeneratingLeaveReason(false);
    }
  };


  const handleApplyFilters = () => {
    if (isGuest) return;
    let filteredData = [...allFetchedAttendanceRecords];

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
    if (isGuest) return;
    setFilterEmployeeName('');
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setDisplayedAttendanceData(allFetchedAttendanceRecords);
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
    if (isGuest || displayedAttendanceData.length === 0) {
      toast({ title: "No Data", description: isGuest ? "Login to download reports." : "No data to download.", variant: "destructive" });
      return;
    }
    const header = "Employee,Date,Status,Clock In,Clock Out,Hours Worked,Department\n";
    const rows = displayedAttendanceData.map(entry => 
      `"${entry.employee}","${entry.date}","${entry.status}","${entry.clockIn || '-'}","${entry.clockOut || '-'}","${entry.hoursWorked || '-'}","${entry.department || '-'}"`
    ).join("\n");
    const csvContent = header + rows;
    triggerDownload(csvContent, 'attendance_report.csv', 'text/csv;charset=utf-8;');
    toast({ title: "CSV Downloaded", description: "Attendance report CSV has been downloaded." });
  };

  const handleDownloadPdfMock = () => { 
    if (isGuest || displayedAttendanceData.length === 0) {
      toast({ title: "No Data", description: isGuest ? "Login to download reports." : "No data to download for text report.", variant: "destructive" });
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
      textContent += `Department: ${entry.department || '-'}\n`;
      textContent += "-------------------------------------------\n";
    });
    triggerDownload(textContent, 'attendance_report_text_version.txt', 'text/plain;charset=utf-8;');
    toast({ title: "Text Report Downloaded", description: "A text version of the attendance report has been downloaded." });
  };


  return (
    <TooltipProvider>
      <PageHeader
        title="Attendance & Reporting"
        description="Manage attendance, view reports, request leave, and track productivity."
      >
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleDownloadPdfMock} disabled={isGuest}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF (Mock)
              </Button>
            </TooltipTrigger>
            {isGuest && <TooltipContent><p>Login to download reports.</p></TooltipContent>}
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleDownloadCsv} disabled={isGuest}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                </Button>
            </TooltipTrigger>
            {isGuest && <TooltipContent><p>Login to download reports.</p></TooltipContent>}
           </Tooltip>
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
            {isClockedIn && !isGuest ? (
              <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-md">
                <p className="font-semibold text-green-700 dark:text-green-400">You are Clocked In</p>
                {lastClockInTimeDisplay && <p className="text-sm text-muted-foreground">Since: {lastClockInTimeDisplay}</p>}
              </div>
            ) : (
              <div className={`text-center p-4 rounded-md ${isGuest ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                <p className={`font-semibold ${isGuest ? 'text-blue-700 dark:text-blue-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                  {isGuest ? "Guest Mode" : "You are Clocked Out"}
                </p>
                 {lastClockInTimeDisplay && !isClockedIn && !isGuest && <p className="text-sm text-muted-foreground">Last clocked in: {lastClockInTimeDisplay}</p>}
                 {isGuest && <p className="text-sm text-muted-foreground">Clock-in/out disabled.</p>}
              </div>
            )}
            {!isClockedIn || isGuest ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleClockIn} className="w-full" size="lg" disabled={isClocking || isGuest}>
                    {isClocking ? <LoaderIcon className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                    Clock In
                  </Button>
                </TooltipTrigger>
                {isGuest && <TooltipContent><p>Login to use this feature.</p></TooltipContent>}
              </Tooltip>
            ) : (
               <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleClockOut} variant="destructive" className="w-full" size="lg" disabled={isClocking || isGuest}>
                        {isClocking ? <LoaderIcon className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
                        Clock Out
                    </Button>
                </TooltipTrigger>
                {isGuest && <TooltipContent><p>Login to use this feature.</p></TooltipContent>}
              </Tooltip>
            )}
             <p className="text-xs text-muted-foreground text-center">
              {isGuest ? "Login to manage your work hours." : "Remember to clock in when you start and clock out when you finish your workday."}
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
                <Input id="employeeName" value={leaveRequest.employeeName} onChange={(e) => handleLeaveRequestChange('employeeName', e.target.value)} placeholder="Your Name" required disabled={isSubmittingLeave || isGuest}/>
              </div>
              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={leaveRequest.leaveType} onValueChange={(value) => handleLeaveRequestChange('leaveType', value)} disabled={isSubmittingLeave || isGuest}>
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
                        disabled={isSubmittingLeave || isGuest}
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
                        disabled={isSubmittingLeave || isGuest}
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
                        disabled={isSubmittingLeave || isGuest}
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
                          isSubmittingLeave || isGuest || (leaveRequest.startDate ? date < leaveRequest.startDate : false)
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
                   {isGuest ? (
                     <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="px-2 py-1 h-auto" disabled>
                            <Wand2 className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Generate reason with AI</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Login for AI assistance.</p></TooltipContent>
                      </Tooltip>
                  ) : (
                    <Popover open={isLeaveReasonPopoverOpen} onOpenChange={setIsLeaveReasonPopoverOpen}>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" size="sm" className="px-2 py-1 h-auto" disabled={isSubmittingLeave}>
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
                  )}
                </div>
                <Textarea id="reason" value={leaveRequest.reason} onChange={(e) => handleLeaveRequestChange('reason', e.target.value)} placeholder="Briefly state the reason for your leave" required disabled={isSubmittingLeave || isGuest}/>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="submit" className="w-full" disabled={isSubmittingLeave || isGuest}>
                        {isSubmittingLeave ? <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Leave Request
                    </Button>
                </TooltipTrigger>
                {isGuest && <TooltipContent><p>Login to submit leave requests.</p></TooltipContent>}
              </Tooltip>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
           <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" />
              {user?.name || 'My'}'s Monthly Snapshot
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
          <CardTitle className="flex items-center text-xl">
            <CalendarDays className="mr-2 h-6 w-6 text-primary" />
            Attendance Calendar
          </CardTitle>
          <CardDescription>
            Visual overview of attendance for {format(currentCalendarMonth, 'MMMM yyyy')}. (Mock Data for Calendar)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <Calendar
            month={currentCalendarMonth}
            onMonthChange={setCurrentCalendarMonth}
            modifiers={dayModifiers} 
            modifiersClassNames={dayModifiersClassNames}
            className="rounded-md border shadow-sm"
            numberOfMonths={1}
          />
        </CardContent>
      </Card>
      
      <Card className="mt-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <UserCircle className="h-10 w-10 text-primary mr-3" />
                <div>
                  <CardTitle className="text-xl">Employee Attendance Overview</CardTitle>
                  <CardDescription>Monthly attendance summary for employees in your organization.</CardDescription>
                </div>
              </div>
            </div>
            {!isGuest && (
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
            )}
        </CardHeader>
        <CardContent>
          {isGuest ? (
             <div className="flex flex-col items-center justify-center py-10 text-center">
                <ShieldQuestion className="h-12 w-12 text-primary mb-4" />
                <p className="text-lg font-semibold mb-2">Full Features Await!</p>
                <p className="text-muted-foreground mb-6 max-w-md">
                  To access detailed attendance records, personalized reports, and manage your team's attendance, please log in or create an account.
                </p>
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Log In</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/register"><UserPlus className="mr-2 h-4 w-4" /> Register</Link>
                  </Button>
                </div>
              </div>
          ) : isLoadingRecords ? (
            <div className="flex items-center justify-center py-10">
              <LoaderIcon className="mr-2 h-8 w-8 animate-spin" />
              <p>Loading attendance records...</p>
            </div>
          ) : fetchError ? (
             <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertTriangle className="mr-2 h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive font-semibold">Failed to load records</p>
              <p className="text-sm text-muted-foreground">{fetchError}</p>
              <Button onClick={fetchAttendanceRecords} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
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
                    <TableHead>Department</TableHead>
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
                      <TableCell>{entry.department || '-'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No attendance records match your filters or no data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
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
    </TooltipProvider>
  );
}

