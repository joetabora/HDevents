import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminControls } from '@/components/events/admin-controls';
import { BudgetCards } from '@/components/events/budget-cards';
import { CategorySection } from '@/components/events/category-section';
import { DebriefPanel } from '@/components/events/debrief-panel';
import { SaveAsTemplateButton } from '@/components/events/save-as-template-button';
import { SubmitButton } from '@/components/forms/submit-button';
import { PageHeader } from '@/components/layout/page-header';
import { FinishEventButton } from '@/components/finish-event-button';
import { Card } from '@/components/ui/card';
import { categoryLabels, categoryValues, eventTypeLabels } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';
import { attachContactToEventFormAction, convertEventContactToLeadFormAction } from '@/modules/contacts/actions';
import { listContactLinkOptions, listContactsForSelection } from '@/modules/contacts/services';
import { buildEventDebriefContext } from '@/modules/events/services/aiDebriefService';
import { getEventById, getEventFinancials, groupItemsByCategory } from '@/modules/events/services';
import { canDeleteRecords, canEditContent } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';

function getCategoryTotal(items: Array<{ fee: number }>): number {
  return items.reduce((sum, item) => sum + item.fee, 0);
}

export default async function EventPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { edit?: string; tab?: string };
}) {
  const currentUser = await requireCurrentUserPage();
  const eventId = params.id;
  const allowEditByRole = canEditContent(currentUser.role);
  const isAdmin = currentUser.role === 'ADMIN';

  const [event, contacts, financials, userOptions, crmContacts] = await Promise.all([
    getEventById(eventId),
    listContactsForSelection(),
    getEventFinancials(eventId),
    allowEditByRole ? listUserOptions() : Promise.resolve([]),
    allowEditByRole ? listContactLinkOptions() : Promise.resolve([])
  ]);

  if (!event) {
    notFound();
  }

  const isCompleted = event.status === 'COMPLETED';
  const adminEditEnabled = isAdmin && searchParams?.edit === '1';
  const allowEdit = allowEditByRole && (!isCompleted || adminEditEnabled);
  const allowDelete = canDeleteRecords(currentUser.role) && (!isCompleted || adminEditEnabled);
  const allowFinalize = allowEditByRole && !isCompleted;
  const selectedTab = searchParams?.tab === 'debrief' ? 'debrief' : 'operations';
  const groupedItems = groupItemsByCategory(event.items);

  const debriefContext = isCompleted && selectedTab === 'debrief' ? await buildEventDebriefContext(event.id) : null;
  const latestDebriefRaw = event.debriefs[0];
  const latestDebrief = latestDebriefRaw
    ? {
        id: latestDebriefRaw.id,
        version: latestDebriefRaw.version,
        generatedAt: latestDebriefRaw.generatedAt.toISOString(),
        content: latestDebriefRaw.content,
        generatedBy: latestDebriefRaw.generatedBy
      }
    : null;

  const baseQuery = new URLSearchParams();
  if (searchParams?.edit === '1') {
    baseQuery.set('edit', '1');
  }

  const operationsHref = (() => {
    const query = new URLSearchParams(baseQuery.toString());
    query.delete('tab');
    const qs = query.toString();
    return qs ? `/events/${event.id}?${qs}` : `/events/${event.id}`;
  })();

  const debriefHref = (() => {
    const query = new URLSearchParams(baseQuery.toString());
    query.set('tab', 'debrief');
    return `/events/${event.id}?${query.toString()}`;
  })();

  return (
    <div className="space-y-10">
      <PageHeader
        title={event.name}
        subtitle={`Date: ${formatDate(event.date)} · Status: ${event.status}${event.eventType ? ` · Type: ${eventTypeLabels[event.eventType as keyof typeof eventTypeLabels] ?? event.eventType}` : ''}`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {allowEditByRole ? <SaveAsTemplateButton eventId={event.id} eventName={event.name} /> : null}
            {allowFinalize ? <FinishEventButton eventId={event.id} /> : null}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href={operationsHref}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition duration-200 ease-in-out ${
            selectedTab === 'operations'
              ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#FF8124]'
              : 'border-[#27272A] bg-[#111113] text-[#A1A1AA] hover:border-[#3f3f46] hover:text-[#FAFAFA]'
          }`}
        >
          Operations
        </Link>
        <Link
          href={debriefHref}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition duration-200 ease-in-out ${
            selectedTab === 'debrief'
              ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#FF8124]'
              : 'border-[#27272A] bg-[#111113] text-[#A1A1AA] hover:border-[#3f3f46] hover:text-[#FAFAFA]'
          }`}
        >
          Debrief & Intelligence
        </Link>
      </div>

      {isCompleted && isAdmin ? <AdminControls eventId={event.id} editingEnabled={adminEditEnabled} /> : null}

      {isCompleted && isAdmin && adminEditEnabled ? (
        <Card className="border-[#FF6A00]/40 bg-[#20170f] text-sm text-[#FFD6B3]">
          This event is completed. You are editing historical data. A new archive version should be generated.
        </Card>
      ) : null}

      {selectedTab === 'debrief' ? (
        isCompleted ? (
          <DebriefPanel
            eventId={event.id}
            canGenerate={allowEditByRole}
            latestDebrief={latestDebrief}
            history={event.debriefs.map((entry) => ({
              id: entry.id,
              version: entry.version,
              generatedAt: entry.generatedAt.toISOString(),
              content: entry.content,
              generatedBy: entry.generatedBy
            }))}
            intelligence={{
              estimatedBudget: debriefContext?.totals.estimatedBudget ?? event.budget,
              actualBudget: debriefContext?.totals.actualBudget ?? (event.finalBudgetUsed ?? financials.totalAllocated),
              budgetVariance:
                debriefContext?.totals.budgetVariance ?? (event.budget - (event.finalBudgetUsed ?? financials.totalAllocated)),
              attendance: debriefContext?.totals.attendance ?? (event.finalAttendance ?? 0),
              taskCompletionRate: debriefContext?.totals.taskCompletionRate ?? 0,
              engagementScore: debriefContext?.marketing.totals.score ?? 0,
              topPostTitle: debriefContext?.marketing.topPost?.title ?? null
            }}
          />
        ) : (
          <Card>
            <p className="text-sm text-[#A1A1AA]">Debrief is available after event completion.</p>
          </Card>
        )
      ) : (
        <>
          <BudgetCards totalBudget={event.budget} allocated={financials.totalAllocated} remaining={financials.remainingBudget} />

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Event Contacts</h2>
            <p className="mt-1 text-xs text-[#A1A1AA]">Attach sponsor/media/lead contacts and track event-side relationships.</p>

            {allowEdit ? (
              <form action={attachContactToEventFormAction} className="mt-4 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="eventId" value={event.id} />
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Contact</span>
                  <select name="contactId" required defaultValue="">
                    <option value="" disabled>
                      Select contact
                    </option>
                    {crmContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.displayName} · {contact.contactType} · {contact.company}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Role Tag</span>
                  <select name="roleTag" defaultValue="">
                    <option value="">General</option>
                    <option value="SPONSOR">Sponsor</option>
                    <option value="MEDIA">Media</option>
                    <option value="LEAD">Lead Prospect</option>
                  </select>
                </label>

                <SubmitButton variant="secondary" pendingText="Linking..." className="w-fit">
                  Attach Contact
                </SubmitButton>
              </form>
            ) : null}

            {event.contactLinks.length === 0 ? (
              <p className="mt-4 text-sm text-[#A1A1AA]">No contacts attached to this event yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {event.contactLinks.map((link) => {
                  const contactName = `${link.contact.firstName ?? ''} ${link.contact.lastName ?? ''}`.trim() || link.contact.contactName || link.contact.businessName;

                  return (
                    <li key={link.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#FAFAFA]">{contactName}</p>
                          <p className="text-xs text-[#A1A1AA]">
                            {link.contact.contactType} · {link.roleTag || 'General'} · {link.contact.company || link.contact.businessName}
                          </p>
                        </div>
                        <div className="text-right text-xs text-[#A1A1AA]">
                          <p>Status: {link.contact.status}</p>
                          <p>Assigned: {link.contact.assignedTo?.name ?? 'Unassigned'}</p>
                        </div>
                      </div>

                      {allowEdit && link.contact.contactType !== 'LEAD' && !link.convertedToLead ? (
                        <form action={convertEventContactToLeadFormAction} className="mt-2 flex flex-wrap items-center gap-2">
                          <input type="hidden" name="contactId" value={link.contact.id} />
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="assignedToId" value={link.contact.assignedToId ?? ''} />
                          <SubmitButton variant="secondary" pendingText="Converting...">
                            Convert To Lead
                          </SubmitButton>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {categoryValues.map((category) => {
            const items = groupedItems[category];

            return (
              <CategorySection
                key={category}
                category={category}
                title={categoryLabels[category]}
                items={items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  fee: item.fee,
                  status: item.status,
                  notes: item.notes,
                  contact: item.contact
                    ? {
                        businessName: item.contact.businessName,
                        contactName: item.contact.contactName
                      }
                    : null,
                  documents: item.documents.map((document) => ({
                    id: document.id,
                    fileName: document.fileName
                  }))
                }))}
                total={getCategoryTotal(items)}
                eventId={event.id}
                contacts={contacts.map((contact) => ({
                  id: contact.id,
                  businessName: contact.businessName,
                  category: contact.category,
                  contactName: contact.contactName
                }))}
                canEdit={allowEdit}
                canDelete={allowDelete}
                taskUsers={userOptions}
              />
            );
          })}

          {isCompleted ? (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Archive History</h2>
              {event.archives.length === 0 ? (
                <p className="mt-2 text-sm text-[#A1A1AA]">No archive versions generated yet.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {event.archives.map((archive) => (
                    <div
                      key={archive.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[#27272A] bg-[#111113] p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <p className="text-sm text-[#FAFAFA]">
                        Version {archive.version} - Generated {formatDate(archive.generatedAt)} - by {archive.generatedBy?.name ?? 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/api/events/${event.id}/archives/${archive.id}/download?kind=zip`}
                          target="_blank"
                          className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-1.5 text-xs font-semibold text-[#FAFAFA] hover:border-[#FF6A00] hover:text-[#FF8124]"
                        >
                          Download ZIP
                        </Link>
                        <Link
                          href={`/api/events/${event.id}/archives/${archive.id}/download?kind=pdf`}
                          target="_blank"
                          className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-1.5 text-xs font-semibold text-[#FAFAFA] hover:border-[#FF6A00] hover:text-[#FF8124]"
                        >
                          Download PDF
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : null}
        </>
      )}

      <Card className="text-xs text-[#A1A1AA]">
        Files are stored locally in <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/uploads</code> and reports in{' '}
        <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/reports</code> and{' '}
        <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/archives</code> for local development.
      </Card>
    </div>
  );
}
