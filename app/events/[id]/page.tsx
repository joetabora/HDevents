import { notFound } from 'next/navigation';
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

function getCategoryTotal(items: { fee: number }[]): number {
  return items.reduce((sum, item) => sum + item.fee, 0);
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const currentUser = await requireCurrentUserPage();
  const eventId = params.id;
  const allowEdit = canEditContent(currentUser.role);
  const allowDelete = canDeleteRecords(currentUser.role);

  const [event, contacts, financials, userOptions] = await Promise.all([
    getEventById(eventId),
    listContactsForSelection(),
    getEventFinancials(eventId),
    allowEdit ? listUserOptions() : Promise.resolve([])
  ]);

  if (!event) {
    notFound();
  }

  const groupedItems = groupItemsByCategory(event.items);

  return (
    <div className="space-y-10">
      <PageHeader
        title={event.name}
        subtitle={`Date: ${formatDate(event.date)} · Status: ${event.status}`}
        right={allowEdit ? <FinishEventButton eventId={event.id} /> : null}
      />

      <BudgetCards
        totalBudget={event.budget}
        allocated={financials.totalAllocated}
        remaining={financials.remainingBudget}
      />

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

      <Card className="text-xs text-[#A1A1AA]">
        Files are stored locally in <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/uploads</code> and reports in{' '}
        <code className="rounded bg-[#111113] px-1.5 py-0.5">/public/reports</code> for local development.
      </Card>
    </div>
  );
}
