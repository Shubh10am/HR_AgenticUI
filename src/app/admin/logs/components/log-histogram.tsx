'use client';

import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { LogResult } from '../types';

const chartConfig = {
  success: { label: 'Succeeded', color: 'hsl(var(--chart-1))' },
  failure: { label: 'Failed', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

/** Stacked event-volume bars, one per time bucket, like a log explorer's histogram. */
export default function LogHistogram({ histogram, bucket }: Pick<LogResult, 'histogram' | 'bucket'>) {
  const tickFormat = bucket.unit === 'day' ? 'd MMM' : bucket.unit === 'hour' ? 'd MMM HH:mm' : 'HH:mm';
  return (
    <ChartContainer config={chartConfig} className="h-36 w-full">
      <BarChart data={histogram} margin={{ left: -24, right: 4, top: 4 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={40} tickFormatter={(value) => format(new Date(value), tickFormat)} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0] ? format(new Date(payload[0].payload.time), 'd MMM yyyy, HH:mm') : ''} />} />
        <Bar dataKey="success" stackId="events" fill="var(--color-success)" />
        <Bar dataKey="failure" stackId="events" fill="var(--color-failure)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
