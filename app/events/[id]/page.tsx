import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminControls } from '@/components/events/admin-controls';
import { BudgetCards } from '@/components/events/budget-cards';
import { CategorySection } from '@/components/events/category-section';
import { PageHeader } from '@/components/layout/page-header';
import { FinishEventButton } from '@/components/finish-event-button';
import { Card } from '@/components/ui/card';
import { categoryLabels, categoryValues } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';
import { listContactsForSelection } from '@/modules/contacts/services';
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
  searchParams?: { edit?: string };
}) {
  const currentUser = await requireCurrentUserPage();
  const eventId = params.id;
  const allowEditByRole = canEditContent(currentUser.role);
  const isAdmin = currentUser.role === 'ADMIN';

  const [event, contacts, financials, userOptions] = await Promise.all([
    getEventById(eventId),
    listContactsForSelection(),
    getEventFinancials(eventId),
    allowEditByRole ? listUserOptions() : Promise.resolve([])
  ]);

  if (!event) {
    notFound();
  }

  const isCompleted = event.status === 'COMPLETED';
  const adminEditEnabled = isAdmin && searchParams?.edit === '1';
  const allowEdit = allowEditByRole && (!isCompleted || adminEditEnabled);
  const allowDelete = canDeleteRecords(currentUser.role) && (!isCompleted || adminEditEnabled);
  const allowFinalize = allowEditByRole && !isCompleted;
  const groupedItems = groupItemsByCategory(event.items);

  return (
    <div className="space-y-10">
      <PageHeader
        title={event.name}
        subtitle={`Date: ${formatDate(event.date)} · Status: ${event.status}`}
        right={allowFinalize ? <FinishEventButton eventId={event.id} /> : null}
      />

      {isCompleted && isAdmin ? <AdminControls eventId={event.id} editingEnabled={adminEditEnabled} /> : null}

      {isCompleted && isAdmin && adminEditEnabled ? (
        <Card className="border-[#FF6A00]/40 bg-[#20170f] text-sm text-[#FFD6B3]">
          This event is completed. You are editing historical data. A new archive version should be generated.
        </Card>
      ) : null}

      <BudgetCards totalBudget={event.budget} allocated={financials.totalAllocated} remaining={financials.remainingBudget} />

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

      <Card className="text-xs text-[#A1A1AA]">
        Files are stored locally in <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/uploads</code> and reports in{' '}
        <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/reports</code> and{' '}
        <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/archives</code> for local development.
      </Card>
    </div>
  );
}
