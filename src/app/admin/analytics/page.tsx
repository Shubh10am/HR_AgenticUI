
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, DollarSign, Activity, FileText, BarChart2, AreaChart, LineChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const kpiData = [
  { title: 'Total Revenue', value: '$250,480', icon: DollarSign, change: '+8.1%', changeType: 'increase', period: 'this month' },
  { title: 'Total Users', value: '1,250', icon: Users, change: '+12.5%', changeType: 'increase', period: 'this month' },
  { title: 'API Calls', value: '1.2M', icon: Activity, change: '+20.3%', changeType: 'increase', period: 'this month' },
  { title: 'Generated Reports', value: '5,820', icon: FileText, change: '-3.2%', changeType: 'decrease', period: 'this month' },
];

export default function AdminAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Platform Analytics"
        description="Deep dive into your application's usage and performance metrics."
      >
        <Select defaultValue="30d">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>
      
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
                {kpi.change} vs. last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><AreaChart className="mr-2 h-5 w-5 text-primary" /> API Usage Over Time</CardTitle>
            <CardDescription>Total API calls per day for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 bg-secondary/30 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Chart Placeholder</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary" /> New User Signups</CardTitle>
            <CardDescription>Daily new user registrations.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 bg-secondary/30 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Chart Placeholder</p>
          </CardContent>
        </Card>
      </div>

       <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary" /> Top Used Features</CardTitle>
            <CardDescription>Most frequently used AI features across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 bg-secondary/30 rounded-md flex items-center justify-center">
             <p className="text-muted-foreground">Chart Placeholder</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> User Geography</CardTitle>
            <CardDescription>User distribution by country.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 bg-secondary/30 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Map Placeholder</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
