'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function AnnualIntelligenceCharts({
  budgetVsActual,
  attendanceTrend,
  engagementTrend,
  vendorUsageFrequency
}: {
  budgetVsActual: Array<{ month: string; estimated: number; actual: number }>;
  attendanceTrend: Array<{ month: string; attendance: number }>;
  engagementTrend: Array<{ month: string; engagement: number }>;
  vendorUsageFrequency: Array<{ vendor: string; usageCount: number }>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Budget vs Actual</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetVsActual}>
              <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: 12, color: '#FAFAFA' }} />
              <Bar dataKey="estimated" fill="#FF8124" radius={[8, 8, 0, 0]} />
              <Bar dataKey="actual" fill="#6b7280" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Attendance Trend</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrend}>
              <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: 12, color: '#FAFAFA' }} />
              <Line type="monotone" dataKey="attendance" stroke="#FF6A00" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Engagement Trend</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={engagementTrend}>
              <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: 12, color: '#FAFAFA' }} />
              <Line type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Vendor Usage Frequency</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendorUsageFrequency}>
              <CartesianGrid stroke="#27272A" strokeDasharray="3 3" />
              <XAxis dataKey="vendor" tick={{ fill: '#A1A1AA', fontSize: 10 }} />
              <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: 12, color: '#FAFAFA' }} />
              <Bar dataKey="usageCount" fill="#FF8124" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
