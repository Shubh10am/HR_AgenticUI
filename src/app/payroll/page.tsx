'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, PlayCircle, DollarSign, Users, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const mockPayrollData = [
  { id: '1', employee: 'John Doe', payPeriod: '07/01/2024 - 07/15/2024', grossPay: '$2,500.00', deductions: '$500.00', netPay: '$2,000.00', status: 'Paid' },
  { id: '2', employee: 'Jane Smith', payPeriod: '07/01/2024 - 07/15/2024', grossPay: '$2,800.00', deductions: '$600.00', netPay: '$2,200.00', status: 'Paid' },
  { id: '3', employee: 'Alice Johnson', payPeriod: '07/01/2024 - 07/15/2024', grossPay: '$3,000.00', deductions: '$650.00', netPay: '$2,350.00', status: 'Paid' },
  { id: '4', employee: 'Bob Williams', payPeriod: '07/01/2024 - 07/15/2024', grossPay: '$2,200.00', deductions: '$450.00', netPay: '$1,750.00', status: 'Processing' },
  { id: '5', employee: 'Charlie Brown', payPeriod: '07/01/2024 - 07/15/2024', grossPay: '$3,500.00', deductions: '$750.00', netPay: '$2,750.00', status: 'Pending' },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'pending':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'processing':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      default:
        return '';
    }
  };

export default function PayrollPage() {
  return (
    <>
      <PageHeader
        title="Payroll Management"
        description="Run payroll, view history, and manage employee compensation."
      >
        <div className="flex items-center gap-2">
            <Button>
                <PlayCircle className="mr-2 h-4 w-4" /> Run New Payroll
            </Button>
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download Reports
            </Button>
        </div>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll Last Cycle</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$11,000.00</div>
            <p className="text-xs text-muted-foreground">+2.5% from previous cycle</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees Paid</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 / 5</div>
            <p className="text-xs text-muted-foreground">For current pay period</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q2 Filed</div>
            <p className="text-xs text-muted-foreground">Next filing due 10/15/2024</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Payroll History</CardTitle>
                <CardDescription>Review past and current payroll cycles.</CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                 <Select defaultValue="july-2024">
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select Pay Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="july-2024">July 2024</SelectItem>
                    <SelectItem value="june-2024">June 2024</SelectItem>
                    <SelectItem value="may-2024">May 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayrollData.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">{payroll.employee}</TableCell>
                    <TableCell>{payroll.payPeriod}</TableCell>
                    <TableCell>{payroll.grossPay}</TableCell>
                    <TableCell className="text-destructive">{payroll.deductions}</TableCell>
                    <TableCell className="font-semibold">{payroll.netPay}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payroll.status)} className={getStatusBadgeClass(payroll.status)}>
                        {payroll.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
