'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart as AreaChartIcon, BarChart as BarChartIcon, Users, DollarSign, ListOrdered, CheckCircle, Activity } from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import Link from 'next/link';

const kpiData = [
  { title: 'Total Users', value: '1,250', icon: Users, change: '+12.5%', changeType: 'increase', href: '/admin/users' },
  { title: 'Active Subscriptions', value: '340', icon: CheckCircle, change: '+5.2%', changeType: 'increase', href: '/admin/organizations' },
  { title: 'Monthly Recurring Revenue', value: '$15,600', icon: DollarSign, change: '-1.8%', changeType: 'decrease', href: '/admin/analytics' },
  { title: 'Open Support Tickets', value: '28', icon: ListOrdered, change: '+3', changeType: 'increase', href: '/admin/support-tickets' },
];

const userGrowthData = [
  { month: 'Jan', users: 150 },
  { month: 'Feb', users: 200 },
  { month: 'Mar', users: 350 },
  { month: 'Apr', users: 500 },
  { month: 'May', users: 680 },
  { month: 'Jun', users: 820 },
  { month: 'Jul', users: 1250 },
];

const planDistributionData = [
    { plan: 'Free', users: 800, fill: 'var(--color-free)'},
    { plan: 'Pro', users: 300, fill: 'var(--color-pro)' },
    { plan: 'Enterprise', users: 150, fill: 'var(--color-enterprise)'},
];

const chartConfig = {
  users: {
    label: "Users",
    color: "hsl(var(--chart-1))",
  },
  free: {
    label: "Free",
    color: "hsl(var(--chart-2))",
  },
  pro: {
    label: "Pro",
    color: "hsl(var(--chart-1))",
  },
  enterprise: {
    label: "Enterprise",
    color: "hsl(var(--chart-5))",
  }
} satisfies import('@/components/ui/chart').ChartConfig;

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Welcome to the control center. Here's an overview of your application."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Link key={kpi.title} href={kpi.href}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
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
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><AreaChartIcon className="mr-2 h-5 w-5 text-primary" /> User Growth</CardTitle>
            <CardDescription>Monthly new user registrations.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData}>
                        <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="users" stroke="var(--color-users)" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChartIcon className="mr-2 h-5 w-5 text-primary" /> Plan Distribution</CardTitle>
            <CardDescription>Distribution of users across subscription plans.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
             <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planDistributionData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="plan" type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="users" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
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
