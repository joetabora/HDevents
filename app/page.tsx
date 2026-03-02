import Link from 'next/link';
import { ArrowUpRight, Calendar, CircleDollarSign, ReceiptText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { listEvents } from '@/modules/events/services';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const events = await listEvents();
  const totalBudget = events.reduce((sum, event) => sum + event.budget, 0);
  const totalAllocated = events.reduce((sum, event) => sum + event.totalAllocated, 0);
  const totalRemaining = events.reduce((sum, event) => sum + event.remainingBudget, 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        subtitle="Track event readiness, budgets, and operations from a single control center."
        right={
          <Link href="/events">
            <Button variant="primary">Manage Events</Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Total Budget</p>
            <CircleDollarSign className="h-5 w-5 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{formatCurrency(totalBudget)}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Allocated</p>
            <ReceiptText className="h-5 w-5 text-[#FF8124]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#FAFAFA]">{formatCurrency(totalAllocated)}</p>
        </Card>

        <Card className={totalRemaining >= 0 ? 'shadow-[0_0_20px_rgba(255,106,0,0.15)]' : ''}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A1A1AA]">Remaining</p>
            <Calendar className="h-5 w-5 text-[#FF8124]" />
          </div>
          <p className={`mt-3 text-3xl font-bold ${totalRemaining < 0 ? 'text-rose-400' : 'text-[#FAFAFA]'}`}>
            {formatCurrency(totalRemaining)}
          </p>
        </Card>
      </section>

      <section className="space-y-6">
        <PageHeader title="Recent Events" subtitle="Quick links to current operations and financial status." />
        <div className="grid gap-4 xl:grid-cols-2">
          {events.slice(0, 6).map((event) => (
            <Card key={event.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#FAFAFA]">{event.name}</h3>
                  <p className="text-sm text-[#A1A1AA]">{formatDate(event.date)}</p>
                </div>
                <span className="rounded-full border border-[#27272A] px-2.5 py-1 text-xs text-[#A1A1AA]">{event.status}</span>
              </div>

              <div className="mt-4 space-y-1 text-sm text-[#A1A1AA]">
                <p>Total: {formatCurrency(event.budget)}</p>
                <p>Allocated: {formatCurrency(event.totalAllocated)}</p>
                <p className={event.remainingBudget < 0 ? 'text-rose-400' : 'text-[#FAFAFA]'}>
                  Remaining: {formatCurrency(event.remainingBudget)}
                </p>
              </div>

              <div className="mt-4">
                <Link
                  href={`/events/${event.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF8124] hover:text-[#FF6A00]"
                >
                  Open Event <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}

          {events.length === 0 ? (
            <Card>
              <p className="text-sm text-[#A1A1AA]">No events yet. Start in Events to create your first operation.</p>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
