
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, BarChart, FileText, Users, Activity, DollarSign, ListOrdered, CheckCircle } from 'lucide-react';

const kpiData = [
  { title: 'Total Users', value: '1,250', icon: Users, change: '+12.5%', changeType: 'increase' },
  { title: 'Active Subscriptions', value: '340', icon: CheckCircle, change: '+5.2%', changeType: 'increase' },
  { title: 'Monthly Recurring Revenue', value: '$15,600', icon: DollarSign, change: '-1.8%', changeType: 'decrease' },
  { title: 'Open Support Tickets', value: '28', icon: ListOrdered, change: '+3', changeType: 'increase' },
];

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Welcome to the control center. Here's an overview of your application."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs ${kpi.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                {kpi.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><AreaChart className="mr-2 h-5 w-5 text-primary" /> User Growth</CardTitle>
            <CardDescription>Monthly new user registrations.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 bg-secondary/30 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Chart Placeholder</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart className="mr-2 h-5 w-5 text-primary" /> Plan Distribution</CardTitle>
            <CardDescription>Distribution of users across subscription plans.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 bg-secondary/30 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Chart Placeholder</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> Recent Activity</CardTitle>
            <CardDescription>A log of recent important events in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">New User:</span> john.doe@newcorp.com registered.</p>
              <p><span className="font-semibold text-foreground">Subscription:</span> aisha.smith@techinc.io upgraded to Pro plan.</p>
              <p><span className="font-semibold text-foreground">System Alert:</span> API latency increased by 200ms.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
