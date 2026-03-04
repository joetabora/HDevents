import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { AddContactModal } from '@/components/modals/add-contact-modal';
import { Card } from '@/components/ui/card';
import { CONTACT_STATUSES, CONTACT_TYPES, parseContactStatus, parseContactType } from '@/lib/types/crm';
import { listCRMContacts } from '@/modules/contacts/services';
import { canEditContent } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';

function safeType(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return parseContactType(value);
  } catch {
    return undefined;
  }
}

function safeStatus(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return parseContactStatus(value);
  } catch {
    return undefined;
  }
}

export const dynamic = 'force-dynamic';

export default async function ContactsPage({
  searchParams
}: {
  searchParams?: { search?: string; type?: string; assignedToId?: string; status?: string };
}) {
  const currentUser = await requireCurrentUserPage();
  const allowEdit = canEditContent(currentUser.role);

  const selectedType = safeType(searchParams?.type);
  const selectedStatus = safeStatus(searchParams?.status);
  const selectedAssigned = searchParams?.assignedToId?.trim() || undefined;
  const selectedSearch = searchParams?.search?.trim() || '';

  const [contacts, userOptions] = await Promise.all([
    listCRMContacts({
      search: selectedSearch,
      contactType: selectedType,
      assignedToId: selectedAssigned,
      status: selectedStatus
    }),
    listUserOptions()
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Internal CRM"
        subtitle="Track leads, vendors, sponsors, media, and follow-ups across events, social, and operations."
        right={allowEdit ? <AddContactModal users={userOptions} /> : null}
      />

      <Card>
        <form className="grid gap-3 md:grid-cols-5" method="GET">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Search</span>
            <input name="search" defaultValue={selectedSearch} placeholder="Name, company, email, phone" />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Type</span>
            <select name="type" defaultValue={selectedType ?? ''}>
              <option value="">All</option>
              {CONTACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Assigned</span>
            <select name="assignedToId" defaultValue={selectedAssigned ?? ''}>
              <option value="">All</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Status</span>
            <select name="status" defaultValue={selectedStatus ?? ''}>
              <option value="">All</option>
              {CONTACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-5 flex items-center justify-end gap-2">
            <button
              type="submit"
              className="rounded-2xl border border-[#FF6A00] bg-[#FF6A00]/15 px-4 py-2 text-sm font-semibold text-[#FF8124] hover:bg-[#FF6A00]/25"
            >
              Apply Filters
            </button>
            <Link
              href="/contacts"
              className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-2 text-sm font-semibold text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {contacts.length === 0 ? (
        <Card>
          <p className="text-sm text-[#A1A1AA]">No contacts found for this filter.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {contacts.map((contact) => {
            const highValueLead = contact.contactType === 'LEAD' && contact.leadScore >= 60;

            return (
              <Link key={contact.id} href={`/contacts/${contact.id}`}>
                <Card className={`transition duration-200 ease-in-out hover:border-[#3f3f46] ${highValueLead ? 'border-[#FF6A00]/55 shadow-[0_0_22px_rgba(255,129,36,0.16)]' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">{contact.displayName}</h3>
                      <p className="mt-1 text-sm text-[#A1A1AA]">{contact.company || contact.businessName}</p>
                      <p className="mt-1 text-xs text-[#A1A1AA]">{contact.email || 'No email'} • {contact.phone || 'No phone'}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full border border-[#27272A] px-2 py-0.5 text-xs text-[#FF8124]">{contact.contactType}</span>
                      <p className="mt-1 text-xs text-[#A1A1AA]">{contact.status}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-1 text-xs text-[#A1A1AA]">
                    <p>Lead Score: <span className="text-[#FAFAFA]">{contact.leadScore}</span></p>
                    <p>Assigned: <span className="text-[#FAFAFA]">{contact.assignedTo?.name ?? 'Unassigned'}</span></p>
                    <p>
                      Last Interaction:{' '}
                      <span className="text-[#FAFAFA]">{contact.lastInteractionAt ? new Date(contact.lastInteractionAt).toLocaleString() : 'No interactions yet'}</span>
                    </p>
                    <p>
                      Linked: <span className="text-[#FAFAFA]">{contact._count.eventLinks} events • {contact._count.socialLinks} social • {contact._count.items} vendor records</span>
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
