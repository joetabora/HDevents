import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { CreateFromTemplatePanel } from '@/components/events/create-from-template-panel';
import { DuplicateEventButton } from '@/components/events/duplicate-event-button';
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
import { listEventTemplates } from '@/modules/events/templates';
import { canDeleteRecords, canEditContent, canModifyBudgets } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const currentUser = await requireCurrentUserPage();
  const allowEdit = canEditContent(currentUser.role);
  const allowDelete = canDeleteRecords(currentUser.role);
  const allowBudgetEdit = canModifyBudgets(currentUser.role);
  const [events, userOptions, templates] = await Promise.all([
    listEvents(),
    allowEdit ? listUserOptions() : Promise.resolve([]),
    allowEdit ? listEventTemplates() : Promise.resolve([])
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Events"
        subtitle="Create, inspect, and close out your active event operations."
      />

      <EventsNav />

      {allowEdit ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold text-[#FAFAFA]">Create Blank Event</h2>
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

          <CreateFromTemplatePanel
            templates={templates.map((template) => ({
              id: template.id,
              name: template.name,
              description: template.description,
              eventType: template.eventType,
              vendors: template.vendors.map((vendor) => ({
                id: vendor.id,
                vendorId: vendor.vendorId,
                priorityLevel: vendor.priorityLevel,
                category: vendor.category,
                vendor: {
                  businessName: vendor.vendor.businessName
                },
                suggestedByHistory: vendor.suggestedByHistory,
                usageCountForType: vendor.usageCountForType
              }))
            }))}
            users={userOptions}
          />
        </div>
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
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full border border-[#27272A] px-2.5 py-1 text-xs text-[#A1A1AA]">{event.status}</span>
                {event.archiveVersion > 0 ? (
                  <span className="rounded-full border border-[#C2410C]/30 bg-[#C2410C]/10 px-2.5 py-1 text-xs font-semibold text-[#FDBA74]">
                    Archive v{event.archiveVersion}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#71717A]">Budget</p>
                  <p className="mt-2 text-sm text-[#FAFAFA]">{formatCurrency(event.budget)}</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">Allocated {formatCurrency(event.totalAllocated)}</p>
                </div>

                <div className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#71717A]">Execution</p>
                  <p className="mt-2 text-sm text-[#FAFAFA]">{event.playbookCompletionPercent}% complete</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    {event.completedExecutionCount}/{event.executionTotalCount} closed
                  </p>
                </div>

                <div className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#71717A]">Vendors</p>
                  <p className="mt-2 text-sm text-[#FAFAFA]">{event.lockedItemsCount} locked</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">{event.itemsCount} total line items</p>
                </div>

                <div className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#71717A]">Coverage</p>
                  <p className="mt-2 text-sm text-[#FAFAFA]">{event.assignedExecutionCount} assigned</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">{event.openExecutionCount} open actions</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-xs text-[#A1A1AA]">
                  <span>Playbook readiness</span>
                  <span>{event.playbookCompletionPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#111113]">
                  <div className="h-full rounded-full bg-[#C2410C]" style={{ width: `${event.playbookCompletionPercent}%` }} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-3 text-sm text-[#A1A1AA]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#71717A]">Budget Position</p>
                  <p className={`mt-2 ${event.remainingBudget < 0 ? 'text-rose-400' : 'text-[#FAFAFA]'}`}>
                    Remaining {formatCurrency(event.remainingBudget)}
                  </p>
                  {event.completedAt ? <p className="mt-1 text-xs text-[#A1A1AA]">Completed {formatDate(event.completedAt)}</p> : null}
                </div>

                <div className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#71717A]">Upcoming Deadlines</p>
                  {event.nextDueItems.length === 0 ? (
                    <p className="mt-2 text-sm text-[#A1A1AA]">No dated actions in the playbook.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {event.nextDueItems.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                          <span className={item.overdue ? 'text-[#FDBA74]' : 'text-[#FAFAFA]'}>{item.title}</span>
                          <span className={item.overdue ? 'text-[#FDBA74]' : 'text-[#A1A1AA]'}>{item.dueDate}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link href={`/events/${event.id}`}>
                <Button variant="secondary">View Event</Button>
              </Link>

              {allowEdit ? <NewTaskButton label="Task" compact relatedType="EVENT" relatedId={event.id} users={userOptions} /> : null}
              {allowEdit ? (
                <DuplicateEventButton
                  event={{
                    id: event.id,
                    name: event.name,
                    date: event.date,
                    budget: event.budget
                  }}
                  users={userOptions}
                  compact
                />
              ) : null}

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
