'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { type Category } from '@/lib/types/domain';
import { categoryLabels, itemStatusValues, statusLabels } from '@/lib/utils/constants';

type ContactOption = {
  id: string;
  businessName: string;
  category: Category;
  contactName: string | null;
};

export function AddItemModal({
  eventId,
  category,
  contacts
}: {
  eventId: string;
  category: Category;
  contacts: ContactOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const filteredContacts = useMemo(() => contacts.filter((contact) => contact.category === category), [contacts, category]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch(`/api/events/${eventId}/items`, {
      method: 'POST',
      body: formData
    });

    const result = (await response.json().catch(() => null)) as
      | { success?: boolean; message?: string; contactCreated?: boolean; documentsUploaded?: number }
      | null;

    if (!response.ok || !result?.success) {
      toast.error(result?.message ?? 'Failed to add item');
      setIsSubmitting(false);
      return;
    }

    toast.success('Item added');

    if (result.contactCreated) {
      toast.success('Contact created');
    }

    if ((result.documentsUploaded ?? 0) > 0) {
      toast.success('Document uploaded');
    }

    setOpen(false);
    setIsSubmitting(false);
    form.reset();
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Item
      </Button>

      <AnimatePresence>
        {open ? (
          <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/65 backdrop-blur-sm" />
              </TransitionChild>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <DialogPanel className="w-full max-w-2xl rounded-2xl border border-[#27272A] bg-[#18181B] p-6 shadow-2xl">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-[#FAFAFA]">Add Item</h3>
                          <p className="text-sm text-[#A1A1AA]">{categoryLabels[category]}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="rounded-xl p-2 text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <form onSubmit={onSubmit} className="space-y-4">
                        <input type="hidden" name="category" value={category} />

                        <div className="grid gap-3 md:grid-cols-2">
                          <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Item Name</span>
                            <input name="name" required />
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Fee (USD)</span>
                            <input name="fee" type="number" step="0.01" min="0" required />
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Status</span>
                            <select name="status" defaultValue="PROSPECT">
                              {itemStatusValues.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Existing Contact</span>
                            <select name="contactId" defaultValue="">
                              <option value="">None selected</option>
                              {filteredContacts.map((contact) => (
                                <option key={contact.id} value={contact.id}>
                                  {contact.businessName}
                                  {contact.contactName ? ` - ${contact.contactName}` : ''}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <details className="rounded-2xl border border-[#27272A] p-3">
                          <summary className="cursor-pointer text-sm font-semibold text-[#FAFAFA]">Create new contact inline</summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <label>
                              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Business Name</span>
                              <input name="newContactBusinessName" />
                            </label>
                            <label>
                              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Contact Name</span>
                              <input name="newContactName" />
                            </label>
                            <label>
                              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Phone</span>
                              <input name="newContactPhone" />
                            </label>
                            <label>
                              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Email</span>
                              <input type="email" name="newContactEmail" />
                            </label>
                            <label className="md:col-span-2">
                              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Contact Notes</span>
                              <textarea name="newContactNotes" rows={2} />
                            </label>
                          </div>
                        </details>

                        <label>
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Item Notes</span>
                          <textarea name="notes" rows={3} />
                        </label>

                        <label>
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Documents</span>
                          <input name="documents" type="file" multiple />
                        </label>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" variant="primary" loading={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Add Item'}
                          </Button>
                        </div>
                      </form>
                    </DialogPanel>
                  </TransitionChild>
                </div>
              </div>
            </Dialog>
          </Transition>
        ) : null}
      </AnimatePresence>
    </>
  );
}
