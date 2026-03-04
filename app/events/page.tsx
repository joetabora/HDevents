import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { EventsNav } from '@/components/events/events-nav';
import { NewTaskButton } from '@/components/tasks/new-task-button';
import { SubmitButton } from '@/components/forms/submit-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { eventTypeLabels, eventTypeValues } from '@/lib/utils/constants';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { createEventAction, deleteEventAction, updateEventBudgetFormAction } from '@/modules/events/actions';
import { listEvents } from '@/modules/events/services';
import { canDeleteRecords, canEditContent, canModifyBudgets } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const currentUser = await requireCurrentUserPage();
  const allowEdit = canEditContent(currentUser.role);
  const allowDelete = canDeleteRecords(currentUser.role);
  const allowBudgetEdit = canModifyBudgets(currentUser.role);
  const [events, userOptions] = await Promise.all([listEvents(), allowEdit ? listUserOptions() : Promise.resolve([])]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Events"
        subtitle="Create, inspect, and close out your active event operations."
      />

      <EventsNav />

      {allowEdit ? (
        <Card>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Create Event</h2>
          <form action={createEventAction} className="mt-4 grid gap-4 md:grid-cols-5">
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

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Event Type</span>
              <select name="eventType" defaultValue="">
                <option value="">Unspecified</option>
                {eventTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {eventTypeLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Assign To</span>
              <select name="assignedToId" defaultValue="">
                <option value="">Unassigned</option>
                {userOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <SubmitButton variant="primary" className="w-fit" pendingText="Creating...">
              Create Event
            </SubmitButton>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">{event.name}</h3>
                <p className="text-sm text-[#A1A1AA]">
                  {formatDate(event.date)}
                  {event.eventType ? ` • ${eventTypeLabels[event.eventType as keyof typeof eventTypeLabels] ?? event.eventType}` : ''}
                </p>
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

              {allowEdit ? <NewTaskButton label="Task" compact relatedType="EVENT" relatedId={event.id} users={userOptions} /> : null}

              {allowDelete ? (
                <form action={deleteEventAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <SubmitButton variant="danger" pendingText="Deleting...">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </SubmitButton>
                </form>
              ) : null}
            </div>

            {allowBudgetEdit ? (
              <form action={updateEventBudgetFormAction} className="mt-3 flex items-end gap-2">
                <input type="hidden" name="eventId" value={event.id} />
                <label className="w-full max-w-xs">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Adjust Budget</span>
                  <input name="budget" type="number" min="0" step="0.01" defaultValue={event.budget} />
                </label>
                <SubmitButton variant="secondary" pendingText="Saving...">
                  Save Budget
                </SubmitButton>
              </form>
            ) : null}
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
