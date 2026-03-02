import { type Category } from '@/lib/types/domain';
import { AddContactModal } from '@/components/modals/add-contact-modal';
import { SubmitButton } from '@/components/forms/submit-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { categoryLabels, categoryValues } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';
import { deleteContactAction, updateContactAction } from '@/modules/contacts/actions';
import { listContacts } from '@/modules/contacts/services';
import { parseCategory } from '@/modules/events/validators';

function safeCategory(value?: string): Category | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return parseCategory(value);
  } catch {
    return undefined;
  }
}

export default async function ContactsPage({
  searchParams
}: {
  searchParams?: { category?: string };
}) {
  const selectedCategory = safeCategory(searchParams?.category);
  const contacts = await listContacts(selectedCategory);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Contacts"
        subtitle="Manage vendor relationships and track event participation history."
        right={<AddContactModal />}
      />

      <Card>
        <div className="flex flex-wrap gap-2">
          <a href="/contacts">
            <Button variant={!selectedCategory ? 'primary' : 'ghost'}>All</Button>
          </a>
          {categoryValues.map((category) => (
            <a key={category} href={`/contacts?category=${category}`}>
              <Button variant={selectedCategory === category ? 'primary' : 'ghost'}>{categoryLabels[category]}</Button>
            </a>
          ))}
        </div>
      </Card>

      {contacts.length === 0 ? (
        <Card>
          <p className="text-sm text-[#A1A1AA]">No contacts found for this filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => {
            const uniqueEvents = Array.from(
              new Map(contact.items.map((item) => [item.event.id, item.event])).values()
            );

            return (
              <Card key={contact.id}>
                <form action={updateContactAction} className="grid gap-3 md:grid-cols-3">
                  <input type="hidden" name="id" value={contact.id} />

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Business Name</span>
                    <input name="businessName" defaultValue={contact.businessName} required />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Category</span>
                    <select name="category" defaultValue={contact.category}>
                      {categoryValues.map((category) => (
                        <option key={category} value={category}>
                          {categoryLabels[category]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Contact Name</span>
                    <input name="contactName" defaultValue={contact.contactName ?? ''} />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Phone</span>
                    <input name="phone" defaultValue={contact.phone ?? ''} />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Email</span>
                    <input name="email" type="email" defaultValue={contact.email ?? ''} />
                  </label>

                  <label className="md:col-span-3">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Notes</span>
                    <textarea name="notes" rows={2} defaultValue={contact.notes ?? ''} />
                  </label>

                  <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-2">
                    <SubmitButton variant="primary" pendingText="Saving...">
                      Save Contact
                    </SubmitButton>
                  </div>
                </form>

                <form action={deleteContactAction} className="mt-3">
                  <input type="hidden" name="id" value={contact.id} />
                  <SubmitButton variant="danger" pendingText="Deleting...">
                    Delete Contact
                  </SubmitButton>
                </form>

                <div className="mt-4 rounded-2xl border border-[#27272A] bg-[#111113] p-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Past Events</h3>
                  {uniqueEvents.length === 0 ? (
                    <p className="mt-1 text-sm text-[#A1A1AA]">No associated events yet.</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-sm text-[#A1A1AA]">
                      {uniqueEvents.map((event) => (
                        <li key={event.id}>
                          {event.name} ({formatDate(event.date)})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
