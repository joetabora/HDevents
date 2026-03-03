'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function ExecutiveCharts({
  engagementTrend,
  operations
}: {
  engagementTrend: Array<{ date: string; score: number }>;
  operations: { openTasks: number; overdueTasks: number; documentsUploadedThisWeek: number };
}) {
  const taskBars = [
    { name: 'Open Tasks', value: operations.openTasks },
    { name: 'Overdue', value: operations.overdueTasks },
    { name: 'Docs This Week', value: operations.documentsUploadedThisWeek }
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Engagement Trend (30 Days)</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={engagementTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#A1A1AA', fontSize: 11 }} tickFormatter={(value) => value.slice(5)} />
              <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: 12, color: '#FAFAFA' }}
                labelStyle={{ color: '#FAFAFA' }}
              />
              <Line type="monotone" dataKey="score" stroke="#FF6A00" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Operations Snapshot</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskBars} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: 12, color: '#FAFAFA' }}
                labelStyle={{ color: '#FAFAFA' }}
              />
              <Bar dataKey="value" fill="#FF8124" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
