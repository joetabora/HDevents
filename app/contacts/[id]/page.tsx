import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuickAddInteractionModal } from '@/components/contacts/quick-add-interaction-modal';
import { SubmitButton } from '@/components/forms/submit-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { CONTACT_SOURCES, CONTACT_STATUSES, CONTACT_TYPES } from '@/lib/types/crm';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  attachContactToEventFormAction,
  attachContactToSocialFormAction,
  convertEventContactToLeadFormAction,
  updateContactFormAction
} from '@/modules/contacts/actions';
import {
  getContactProfile,
  listEventsForContactSelection,
  listSocialPostsForContactSelection
} from '@/modules/contacts/services';
import { canEditContent } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';

export const dynamic = 'force-dynamic';

function formatDateTime(value: Date | null): string {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function engagementScore(metrics: { likes: number; comments: number; shares: number; views: number }) {
  return Math.round(metrics.likes + metrics.comments * 3 + metrics.shares * 5 + metrics.views / 10);
}

export default async function ContactProfilePage({ params }: { params: { id: string } }) {
  const currentUser = await requireCurrentUserPage();
  const allowEdit = canEditContent(currentUser.role);

  const [contact, userOptions, eventOptions, socialOptions] = await Promise.all([
    getContactProfile(params.id),
    allowEdit ? listUserOptions() : Promise.resolve([]),
    allowEdit ? listEventsForContactSelection() : Promise.resolve([]),
    allowEdit ? listSocialPostsForContactSelection() : Promise.resolve([])
  ]);

  if (!contact) {
    notFound();
  }

  const openTasks = contact.tasks.filter((task) => !task.completed);

  return (
    <div className="space-y-10">
      <PageHeader
        title={contact.displayName}
        subtitle={`${contact.contactType} · ${contact.status} · ${contact.company || contact.businessName}`}
        right={allowEdit ? <QuickAddInteractionModal contactId={contact.id} /> : null}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Profile</h2>
          <div className="mt-3 grid gap-2 text-sm text-[#A1A1AA] md:grid-cols-2">
            <p>Email: <span className="text-[#FAFAFA]">{contact.email || 'Not set'}</span></p>
            <p>Phone: <span className="text-[#FAFAFA]">{contact.phone || 'Not set'}</span></p>
            <p>Assigned: <span className="text-[#FAFAFA]">{contact.assignedTo?.name ?? 'Unassigned'}</span></p>
            <p>Source: <span className="text-[#FAFAFA]">{contact.source}</span></p>
          </div>
          {contact.notes ? <p className="mt-3 text-sm text-[#A1A1AA]">{contact.notes}</p> : null}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Scoring</h2>
          <p className="mt-3 text-sm text-[#A1A1AA]">
            Lead Score: <span className="rounded-full border border-[#FF6A00]/50 bg-[#FF6A00]/10 px-2 py-0.5 text-xs font-semibold text-[#FF8124]">{contact.leadScore}</span>
          </p>
          {contact.vendorPerformanceScore !== null ? (
            <p className="mt-2 text-sm text-[#A1A1AA]">
              Vendor Performance: <span className="text-[#FAFAFA]">{contact.vendorPerformanceScore}%</span>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[#A1A1AA]">Created {formatDate(contact.createdAt)}</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">Updated {formatDate(contact.updatedAt)}</p>
        </Card>
      </section>

      {allowEdit ? (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Edit Contact</h2>
          <form action={updateContactFormAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <input type="hidden" name="id" value={contact.id} />
            <input type="hidden" name="previousStatus" value={contact.status} />

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">First Name</span>
              <input name="firstName" defaultValue={contact.firstName ?? ''} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Last Name</span>
              <input name="lastName" defaultValue={contact.lastName ?? ''} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Business Name</span>
              <input name="businessName" defaultValue={contact.businessName} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Company</span>
              <input name="company" defaultValue={contact.company ?? ''} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Contact Name</span>
              <input name="contactName" defaultValue={contact.contactName ?? ''} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Category</span>
              <select name="category" defaultValue={contact.category}>
                <option value="FOOD">FOOD</option>
                <option value="ENTERTAINMENT">ENTERTAINMENT</option>
                <option value="MERCH">MERCH</option>
                <option value="PERMIT">PERMIT</option>
                <option value="MISC">MISC</option>
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Type</span>
              <select name="contactType" defaultValue={contact.contactType}>
                {CONTACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Source</span>
              <select name="source" defaultValue={contact.source}>
                {CONTACT_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Status</span>
              <select name="status" defaultValue={contact.status}>
                {CONTACT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Assigned User</span>
              <select name="assignedToId" defaultValue={contact.assignedToId ?? ''}>
                <option value="">Unassigned</option>
                {userOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Email</span>
              <input name="email" type="email" defaultValue={contact.email ?? ''} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Phone</span>
              <input name="phone" defaultValue={contact.phone ?? ''} />
            </label>

            <label className="md:col-span-3">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Notes</span>
              <textarea name="notes" rows={3} defaultValue={contact.notes ?? ''} />
            </label>

            <SubmitButton variant="primary" pendingText="Saving..." className="w-fit">
              Save Contact
            </SubmitButton>
          </form>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Interaction Timeline</h2>
          {contact.interactions.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No interactions logged yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {contact.interactions.map((interaction) => (
                <li key={interaction.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2">
                  <p className="text-xs text-[#FF8124]">{interaction.type}</p>
                  <p className="mt-1 text-sm text-[#FAFAFA]">{interaction.summary}</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    {formatDateTime(interaction.createdAt)} · by {interaction.createdBy?.name ?? 'Unknown'}
                  </p>
                  {interaction.followUpDate ? (
                    <p className="mt-1 text-xs text-[#A1A1AA]">Follow-up: {formatDateTime(interaction.followUpDate)}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Tasks Tied To Contact</h2>
          {contact.tasks.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No tasks linked yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {contact.tasks.map((task) => {
                const isOverdue = !task.completed && task.dueDate && task.dueDate.getTime() < Date.now();
                return (
                  <li
                    key={task.id}
                    className={`rounded-2xl border px-3 py-2 ${
                      isOverdue ? 'border-[#FF6A00]/60 bg-[#2a1406]' : 'border-[#27272A] bg-[#111113]'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${task.completed ? 'text-[#A1A1AA]' : 'text-[#FAFAFA]'}`}>{task.title}</p>
                    {task.description ? <p className="mt-1 text-xs text-[#A1A1AA]">{task.description}</p> : null}
                    <p className="mt-1 text-xs text-[#A1A1AA]">
                      {task.completed ? 'Completed' : 'Open'} · Due {formatDateTime(task.dueDate)} · Assigned to {task.assignedTo?.name ?? 'Unassigned'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-[#A1A1AA]">Open follow-ups: {openTasks.length}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Related Events</h2>

          {allowEdit ? (
            <form action={attachContactToEventFormAction} className="mt-3 grid gap-3 md:grid-cols-3">
              <input type="hidden" name="contactId" value={contact.id} />
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Attach To Event</span>
                <select name="eventId" required defaultValue="">
                  <option value="" disabled>
                    Select event
                  </option>
                  {eventOptions.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} · {formatDate(event.date)}
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

          {contact.eventLinks.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No event relationships yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {contact.eventLinks.map((link) => (
                <li key={link.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link href={`/events/${link.event.id}`} className="text-sm font-semibold text-[#FAFAFA] hover:text-[#FF8124]">
                        {link.event.name}
                      </Link>
                      <p className="text-xs text-[#A1A1AA]">{formatDate(link.event.date)} · {link.event.status}</p>
                    </div>
                    <div className="text-right text-xs text-[#A1A1AA]">
                      <p>Role: <span className="text-[#FAFAFA]">{link.roleTag || 'General'}</span></p>
                      <p>{link.convertedToLead ? 'Converted to lead' : 'Not converted'}</p>
                    </div>
                  </div>

                  {allowEdit && contact.contactType !== 'LEAD' && !link.convertedToLead ? (
                    <form action={convertEventContactToLeadFormAction} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="contactId" value={contact.id} />
                      <input type="hidden" name="eventId" value={link.event.id} />
                      <input type="hidden" name="assignedToId" value={contact.assignedToId ?? ''} />
                      <SubmitButton variant="secondary" pendingText="Converting...">
                        Convert To Lead
                      </SubmitButton>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Related Social Campaigns</h2>

          {allowEdit ? (
            <form action={attachContactToSocialFormAction} className="mt-3 grid gap-3 md:grid-cols-3">
              <input type="hidden" name="contactId" value={contact.id} />
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Attach To Post</span>
                <select name="socialPostId" required defaultValue="">
                  <option value="" disabled>
                    Select post
                  </option>
                  {socialOptions.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.title} · {post.status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Relationship</span>
                <select name="relationshipType" defaultValue="COMMENTER">
                  <option value="COMMENTER">Commenter</option>
                  <option value="INFLUENCER">Influencer</option>
                  <option value="SPONSOR">Sponsor</option>
                  <option value="ADVOCATE">Advocate</option>
                </select>
              </label>
              <SubmitButton variant="secondary" pendingText="Linking..." className="w-fit">
                Link Social Post
              </SubmitButton>
            </form>
          ) : null}

          {contact.socialLinks.length === 0 ? (
            <p className="mt-3 text-sm text-[#A1A1AA]">No social relationships tracked yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {contact.socialLinks.map((link) => {
                const publicScore = engagementScore({
                  likes: link.socialPost.publicLikes,
                  comments: link.socialPost.publicComments,
                  shares: link.socialPost.publicShares,
                  views: link.socialPost.publicViews
                });

                const fallbackScore = engagementScore({
                  likes: link.socialPost.likes,
                  comments: link.socialPost.comments,
                  shares: link.socialPost.shares,
                  views: link.socialPost.views
                });

                return (
                  <li key={link.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2">
                    <p className="text-sm font-semibold text-[#FAFAFA]">{link.socialPost.title}</p>
                    <p className="mt-1 text-xs text-[#A1A1AA]">{link.relationshipType} · {link.socialPost.platforms.join(', ')}</p>
                    <p className="mt-1 text-xs text-[#A1A1AA]">Engagement Score: {publicScore > 0 ? publicScore : fallbackScore}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      {contact.items.length > 0 ? (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Vendor Relationship History</h2>
          <ul className="mt-3 space-y-2">
            {contact.items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#FAFAFA]">{item.name}</p>
                  <p className="text-xs text-[#A1A1AA]">{item.status}</p>
                </div>
                <p className="mt-1 text-xs text-[#A1A1AA]">{item.category} · {formatCurrency(item.fee)}</p>
                <p className="mt-1 text-xs text-[#A1A1AA]">
                  Event: <Link href={`/events/${item.event.id}`} className="text-[#FAFAFA] hover:text-[#FF8124]">{item.event.name}</Link>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
