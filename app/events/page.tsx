import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { SubmitButton } from '@/components/forms/submit-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { createEventAction, deleteEventAction } from '@/modules/events/actions';
import { listEvents } from '@/modules/events/services';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Events"
        subtitle="Create, inspect, and close out your active event operations."
      />

      <Card>
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Create Event</h2>
        <form action={createEventAction} className="mt-4 grid gap-4 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Event Name</span>
            <input name="name" required />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Event Date</span>
            <input name="date" type="date" required />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Budget (USD)</span>
            <input name="budget" type="number" min="0" step="0.01" required />
          </label>

          <SubmitButton variant="primary" className="w-fit" pendingText="Creating...">
            Create Event
          </SubmitButton>
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">{event.name}</h3>
                <p className="text-sm text-[#A1A1AA]">{formatDate(event.date)}</p>
              </div>
              <span className="rounded-full border border-[#27272A] px-2.5 py-1 text-xs text-[#A1A1AA]">{event.status}</span>
            </div>

            <div className="mt-4 grid gap-1 text-sm text-[#A1A1AA]">
              <p>Budget: {formatCurrency(event.budget)}</p>
              <p>Allocated: {formatCurrency(event.totalAllocated)}</p>
              <p className={event.remainingBudget < 0 ? 'text-rose-400' : 'text-[#FAFAFA]'}>Remaining: {formatCurrency(event.remainingBudget)}</p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link href={`/events/${event.id}`}>
                <Button variant="secondary">View Event</Button>
              </Link>

              <form action={deleteEventAction}>
                <input type="hidden" name="id" value={event.id} />
                <SubmitButton variant="danger" pendingText="Deleting...">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </SubmitButton>
              </form>
            </div>
          </Card>
        ))}

        {events.length === 0 ? (
          <Card>
            <p className="text-sm text-[#A1A1AA]">No events yet.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
