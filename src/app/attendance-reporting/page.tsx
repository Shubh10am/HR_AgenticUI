import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, UserCircle } from 'lucide-react';

const attendanceData = [
  { date: '2024-07-01', status: 'Present', clockIn: '09:00 AM', clockOut: '05:30 PM' },
  { date: '2024-07-02', status: 'Present', clockIn: '09:05 AM', clockOut: '05:35 PM' },
  { date: '2024-07-03', status: 'Absent', clockIn: '-', clockOut: '-' },
  { date: '2024-07-04', status: 'Late', clockIn: '09:45 AM', clockOut: '06:00 PM' },
  { date: '2024-07-05', status: 'Present', clockIn: '08:55 AM', clockOut: '05:25 PM' },
];

export default function AttendanceReportingPage() {
  return (
    <>
      <PageHeader
        title="Attendance &amp; Reporting"
        description="View individual monthly attendance, productivity, and behavior reports."
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

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-xl">Monthly Report - John Doe</CardTitle>
              <CardDescription>July 2024</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Attendance Details</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((entry) => (
                    <TableRow key={entry.date}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === 'Present' ? 'default' :
                            entry.status === 'Absent' ? 'destructive' :
                            'secondary' // For 'Late'
                          }
                          className={
                            entry.status === 'Present' ? 'bg-green-500 hover:bg-green-600 text-white' :
                            entry.status === 'Late' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''
                          }
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
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Productivity Summary</h3>
              <Card className="bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">
                  John completed 15 tasks this month, exceeding the target of 12 tasks.
                  Key contributions include leading the X project and resolving Y critical bug.
                  Overall productivity rated as 'High'.
                </p>
              </Card>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Behavior Notes</h3>
              <Card className="bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">
                  John consistently demonstrates strong teamwork and communication skills.
                  Proactive in meetings and always willing to help colleagues.
                  Received positive feedback from team members on collaboration.
                </p>
              </Card>
            </section>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
