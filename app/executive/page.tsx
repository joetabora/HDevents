import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, CalendarClock, Eye, FileStack, Gauge, Goal, Handshake, Megaphone, UserPlus, Users, Wallet } from 'lucide-react';
import { ExecutiveCharts } from '@/components/dashboard/executive-charts';
import { WeeklySummaryButton } from '@/components/dashboard/weekly-summary-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { getExecutiveOverview } from '@/modules/dashboard/services';
import { canViewExecutiveOverview } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';

export const dynamic = 'force-dynamic';

export default async function ExecutivePage() {
  const user = await requireCurrentUserPage();

  if (!canViewExecutiveOverview(user.role)) {
    redirect('/');
  }

  const summary = await getExecutiveOverview();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Executive Overview"
        subtitle="Minimal, high-signal view of marketing, events, and operations performance."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/executive/intelligence"
              className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-2 text-sm font-semibold text-[#FAFAFA] hover:border-[#FF6A00] hover:text-[#FF8124]"
            >
              Annual Intelligence
            </Link>
            <WeeklySummaryButton />
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Posts This Week</p>
            <Megaphone className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{summary.marketing.postsThisWeek}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Used Bikes Today</p>
            <Goal className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{summary.marketing.usedBikesToday} / 4</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Active Events</p>
            <Handshake className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{summary.events.activeEvents}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Overdue Tasks</p>
            <Gauge className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-300">{summary.operations.overdueTasks}</p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Total Active Leads</p>
            <Users className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{summary.crm.totalActiveLeads}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Leads This Month</p>
            <UserPlus className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{summary.crm.leadsThisMonth}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Follow-ups Due Today</p>
            <CalendarClock className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{summary.crm.followUpsDueToday}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Overdue Follow-ups</p>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-300">{summary.crm.overdueFollowUps}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">New Contacts This Week</p>
            <Users className="h-4 w-4 text-[#FF8124]" />
          </div>
          <p className="mt-2 text-3xl font-bold text-[#FAFAFA]">{summary.crm.newContactsThisWeek}</p>
        </Card>
      </section>

      <ExecutiveCharts engagementTrend={summary.marketing.engagementTrend} operations={summary.operations} />

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#FF8124]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Top Performing Post</h2>
          </div>
          {summary.marketing.topPerformingPost ? (
            <>
              <p className="text-sm font-semibold text-[#FAFAFA]">{summary.marketing.topPerformingPost.title}</p>
              <p className="mt-1 text-xs text-[#A1A1AA]">Score {summary.marketing.topPerformingPost.score}</p>
            </>
          ) : (
            <p className="text-sm text-[#A1A1AA]">No top post yet.</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#FF8124]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Budget vs Spent</h2>
          </div>
          <p className="text-sm text-[#A1A1AA]">Budget {formatCurrency(summary.events.budget.totalBudget)}</p>
          <p className="mt-1 text-sm text-[#A1A1AA]">Spent {formatCurrency(summary.events.budget.totalSpent)}</p>
          <p className="mt-1 text-sm text-[#FAFAFA]">
            Remaining {formatCurrency(summary.events.budget.totalBudget - summary.events.budget.totalSpent)}
          </p>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <FileStack className="h-4 w-4 text-[#FF8124]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Operations</h2>
          </div>
          <p className="text-sm text-[#A1A1AA]">Open tasks: {summary.operations.openTasks}</p>
          <p className="mt-1 text-sm text-[#A1A1AA]">Locked vendors: {summary.events.lockedVendors}</p>
          <p className="mt-1 text-sm text-[#A1A1AA]">Documents uploaded this week: {summary.operations.documentsUploadedThisWeek}</p>
        </Card>
      </section>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Top 10 Posts Leaderboard</h2>
        {summary.marketing.leaderboard.length === 0 ? (
          <p className="mt-3 text-sm text-[#A1A1AA]">No posted content yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {summary.marketing.leaderboard.map((post, index) => (
              <li key={post.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                <p className="text-sm font-semibold text-[#FAFAFA]">
                  #{index + 1} {post.title}
                </p>
                <p className="mt-1 text-xs text-[#A1A1AA]">{post.platforms.join(', ')} • Score {post.score}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
