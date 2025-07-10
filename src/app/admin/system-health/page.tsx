
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Zap, ShieldAlert, CheckCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const systemStatus = [
    { name: "API Gateway", status: "Operational", icon: Zap, color: "text-green-500" },
    { name: "Database", status: "Operational", icon: Database, color: "text-green-500" },
    { name: "AI Model Endpoint (Gemini)", status: "Degraded Performance", icon: ShieldAlert, color: "text-yellow-500" },
    { name: "Authentication Service", status: "Operational", icon: CheckCircle, color: "text-green-500" },
];

const apiLogs = [
    { timestamp: "2024-07-26 10:30:01", endpoint: "/api/auth/login", method: "POST", status: 200, duration: "75ms", ip: "192.168.1.1" },
    { timestamp: "2024-07-26 10:31:15", endpoint: "/api/employees", method: "GET", status: 200, duration: "120ms", ip: "192.168.1.1" },
    { timestamp: "2024-07-26 10:32:05", endpoint: "/ai/generateJobDescription", method: "POST", status: 503, duration: "5200ms", ip: "192.168.1.2" },
    { timestamp: "2024-07-26 10:33:40", endpoint: "/api/settings/api-key", method: "GET", status: 200, duration: "50ms", ip: "192.168.1.3" },
    { timestamp: "2024-07-26 10:35:22", endpoint: "/api/auth/register", method: "POST", status: 409, duration: "95ms", ip: "203.0.113.5" },
];


export default function AdminSystemHealthPage() {
    const getStatusBadgeVariant = (status: number) => {
        if (status >= 500) return 'destructive';
        if (status >= 400) return 'secondary';
        if (status >= 200 && status < 300) return 'default';
        return 'outline';
    }

  return (
    <>
      <PageHeader
        title="System Health & Logs"
        description="Monitor system status and review recent API activity."
      />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5 text-primary" />
                Current System Status
            </CardTitle>
            <CardDescription>Live status of core application services.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatus.map(service => (
                <Card key={service.name} className="bg-secondary/50 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <service.icon className={`mr-3 h-6 w-6 ${service.color}`} />
                        <div>
                            <p className="font-semibold">{service.name}</p>
                            <p className={`text-sm ${service.color}`}>{service.status}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Real-time API Logs</CardTitle>
          <CardDescription>A live feed of API requests and system events.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 font-mono text-xs">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiLogs.map((log) => (
                  <TableRow key={log.timestamp}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{log.endpoint}</TableCell>
                    <TableCell>
                        <Badge variant={log.method === 'POST' ? 'secondary' : 'outline'}>{log.method}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>
                    </TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell>{log.ip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
           <div className="mt-4 flex justify-end">
                <Button variant="outline">Export Logs</Button>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
