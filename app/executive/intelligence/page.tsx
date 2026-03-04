import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AnnualIntelligenceCharts } from '@/components/dashboard/annual-intelligence-charts';
import { AnnualIntelligenceReportButton } from '@/components/dashboard/annual-intelligence-report-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { getAnnualIntelligence, listIntelligenceYears } from '@/modules/dashboard/services/intelligenceEngine';
import { canViewExecutiveOverview } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';

export const dynamic = 'force-dynamic';

export default async function AnnualIntelligencePage({ searchParams }: { searchParams?: { year?: string } }) {
  const user = await requireCurrentUserPage();

  if (!canViewExecutiveOverview(user.role)) {
    redirect('/');
  }

  const years = await listIntelligenceYears();
  const requestedYear = Number(searchParams?.year ?? years[0] ?? new Date().getFullYear());
  const year = years.includes(requestedYear) ? requestedYear : years[0] ?? new Date().getFullYear();
  const intelligence = await getAnnualIntelligence(year);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Annual Event Intelligence"
        subtitle="Year-over-year dealership operations intelligence across events, vendors, and marketing impact."
        right={<AnnualIntelligenceReportButton year={year} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/executive" className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#A1A1AA] hover:text-[#FAFAFA]">
          Back to Executive
        </Link>

        <form method="GET" className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A1A1AA]">Year</label>
          <select name="year" defaultValue={String(year)}>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-xs font-semibold text-[#FAFAFA] hover:border-[#FF6A00] hover:text-[#FF8124]">
            Apply
          </button>
        </form>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-[#A1A1AA]">Total Events</p>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{intelligence.summary.totalEvents}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#A1A1AA]">Budget vs Actual</p>
          <p className="mt-2 text-sm text-[#FAFAFA]">{formatCurrency(intelligence.summary.totalEstimatedBudget)}</p>
          <p className="mt-1 text-sm text-[#A1A1AA]">Actual: {formatCurrency(intelligence.summary.totalActualSpend)}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#A1A1AA]">Attendance</p>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{intelligence.summary.totalAttendance}</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Avg/Event: {intelligence.summary.averageAttendancePerEvent}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#A1A1AA]">Engagement Score</p>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{intelligence.summary.totalEngagementScore}</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Posts: {intelligence.summary.totalMarketingPosts}</p>
        </Card>
      </section>

      <AnnualIntelligenceCharts
        budgetVsActual={intelligence.charts.budgetVsActual}
        attendanceTrend={intelligence.charts.attendanceTrend}
        engagementTrend={intelligence.charts.engagementTrend}
        vendorUsageFrequency={intelligence.charts.vendorUsageFrequency}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Top / Lowest Event</h2>
          <p className="mt-3 text-sm text-[#A1A1AA]">
            Top: {intelligence.summary.topPerformingEvent ? `${intelligence.summary.topPerformingEvent.name} (${intelligence.summary.topPerformingEvent.efficiencyScore})` : 'N/A'}
          </p>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            Lowest: {intelligence.summary.lowestPerformingEvent ? `${intelligence.summary.lowestPerformingEvent.name} (${intelligence.summary.lowestPerformingEvent.efficiencyScore})` : 'N/A'}
          </p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Vendor Intelligence</h2>
          <p className="mt-3 text-sm text-[#A1A1AA]">
            Most used: {intelligence.summary.mostUsedVendor ? `${intelligence.summary.mostUsedVendor.vendorName} (${intelligence.summary.mostUsedVendor.usageCount})` : 'N/A'}
          </p>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            Highest cost: {intelligence.summary.highestCostVendor ? `${intelligence.summary.highestCostVendor.vendorName} (${formatCurrency(intelligence.summary.highestCostVendor.totalCost)})` : 'N/A'}
          </p>
          <p className="mt-1 text-sm text-[#FAFAFA]">Consistency score: {intelligence.summary.vendorConsistencyScore}</p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">AI Summary</h2>
          <p className="mt-3 text-sm text-[#A1A1AA]">{intelligence.summaryParagraph}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Top ROI</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#A1A1AA]">
            {intelligence.ranking.byROI.map((row) => (
              <li key={row.id}>{row.name} - {row.roiScore.toFixed(4)}</li>
            ))}
            {intelligence.ranking.byROI.length === 0 ? <li>No data.</li> : null}
          </ul>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Top Engagement</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#A1A1AA]">
            {intelligence.ranking.byEngagement.map((row) => (
              <li key={row.id}>{row.name} - {row.engagement}</li>
            ))}
            {intelligence.ranking.byEngagement.length === 0 ? <li>No data.</li> : null}
          </ul>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Attendance Growth</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#A1A1AA]">
            {intelligence.ranking.byAttendanceGrowth.map((row) => (
              <li key={row.id}>{row.name} - {row.attendanceGrowth >= 0 ? '+' : ''}{row.attendanceGrowth}</li>
            ))}
            {intelligence.ranking.byAttendanceGrowth.length === 0 ? <li>No data.</li> : null}
          </ul>
        </Card>
      </section>
    </div>
  );
}
