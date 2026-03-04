'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Link2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { attachContactToSocialAction } from '@/modules/contacts/actions';

export function LinkContactToSocialModal({
  socialPostId,
  contacts
}: {
  socialPostId: string;
  contacts: Array<{
    id: string;
    displayName: string;
    company: string;
    contactType: string;
    status: string;
  }>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set('socialPostId', socialPostId);

    const result = await attachContactToSocialAction(formData);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={() => setOpen(true)}>
        <Link2 className="h-3.5 w-3.5" />
        Link Contact
      </Button>

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
                <DialogPanel className="w-full max-w-xl rounded-2xl border border-[#27272A] bg-[#18181B] p-6 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Link Contact</h3>
                      <p className="text-sm text-[#A1A1AA]">Attach an existing CRM contact to this social post.</p>
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
                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Contact</span>
                      <select name="contactId" required defaultValue="">
                        <option value="" disabled>
                          Select contact
                        </option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.displayName} · {contact.contactType} · {contact.company}
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
                        <option value="MEDIA">Media</option>
                        <option value="CUSTOMER">Customer</option>
                      </select>
                    </label>

                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={isPending}>
                        {isPending ? 'Saving...' : 'Link Contact'}
                      </Button>
                    </div>
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
