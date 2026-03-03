import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Briefcase, Calendar, CircleDollarSign, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { getPersonalOverview } from '@/modules/dashboard/services';
import { canViewExecutiveOverview } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const currentUser = await requireCurrentUserPage();
  const overview = await getPersonalOverview(currentUser);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Your Overview"
        subtitle="Assigned execution, follow-ups, and personal production across the shared organization workspace."
        right={
          <div className="flex items-center gap-2">
            {canViewExecutiveOverview(currentUser.role) ? (
              <Link href="/executive">
                <Button variant="secondary">Executive View</Button>
              </Link>
            ) : null}
            <Link href="/tasks/mine">
              <Button variant="primary">Open My Tasks</Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Assigned Tasks</p>
            <Briefcase className="h-5 w-5 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{overview.assignedTasks.length}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Upcoming Follow-ups</p>
            <Calendar className="h-5 w-5 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{overview.upcomingFollowUps.length}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Social Posts Created By You</p>
            <Megaphone className="h-5 w-5 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{overview.socialPostsCreatedByYou.length}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Events Assigned To You</p>
            <CircleDollarSign className="h-5 w-5 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{overview.eventsAssignedToYou.length}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Upcoming Follow-ups</h2>
          {overview.upcomingFollowUps.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No follow-ups scheduled.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {overview.upcomingFollowUps.map((task) => (
                <li key={task.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                  <p className="text-sm font-semibold text-[#FAFAFA]">{task.title}</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    {task.relatedType}
                    {task.dueDate ? ` • Due ${formatDate(task.dueDate)}` : ' • No due date'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Activity Feed</h2>
          {overview.activity.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No activity yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {overview.activity.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3 text-[#A1A1AA]">
                  <p className="font-semibold text-[#FAFAFA]">{entry.action.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs">{entry.entityType}{entry.entityId ? ` • ${entry.entityId.slice(0, 8)}` : ''} • {formatDate(entry.timestamp)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Social Posts Created By You</h2>
          {overview.socialPostsCreatedByYou.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No posts yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {overview.socialPostsCreatedByYou.map((post) => (
                <li key={post.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                  <p className="text-sm font-semibold text-[#FAFAFA]">{post.title}</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">{post.platforms.join(', ')} • {post.status}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Events Assigned To You</h2>
          {overview.eventsAssignedToYou.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No assigned events.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {overview.eventsAssignedToYou.map((event) => {
                const spent = event.items.reduce((sum, item) => sum + item.fee, 0);
                return (
                  <li key={event.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#FAFAFA]">{event.name}</p>
                        <p className="mt-1 text-xs text-[#A1A1AA]">{formatDate(event.date)} • {event.status}</p>
                      </div>
                      <Link
                        href={`/events/${event.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF8124] hover:text-[#FF6A00]"
                      >
                        Open <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <p className="mt-2 text-xs text-[#A1A1AA]">Budget {formatCurrency(event.budget)} • Spent {formatCurrency(spent)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      {overview.budgetAlerts.length > 0 ? (
        <Card>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#FF8124]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Budget Alerts</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {overview.budgetAlerts.map((alert) => (
              <li key={alert.id} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-[#FAFAFA]">{alert.name}</p>
                <p className="mt-1 text-xs text-rose-300">
                  Budget {formatCurrency(alert.budget)} • Spent {formatCurrency(alert.spent)} • Remaining {formatCurrency(alert.remaining)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
