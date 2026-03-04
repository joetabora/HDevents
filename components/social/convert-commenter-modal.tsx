'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createLeadFromSocialAction } from '@/modules/contacts/actions';

export function ConvertCommenterModal({
  socialPostId,
  users
}: {
  socialPostId: string;
  users: Array<{ id: string; name: string; email: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set('socialPostId', socialPostId);

    const result = await createLeadFromSocialAction(formData);
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
        <UserPlus className="h-3.5 w-3.5" />
        Convert Commenter
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
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Convert Commenter To Lead</h3>
                      <p className="text-sm text-[#A1A1AA]">Create an internal lead from social engagement.</p>
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
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">First Name</span>
                        <input name="firstName" required />
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Last Name</span>
                        <input name="lastName" />
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Email</span>
                        <input name="email" type="email" />
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Phone</span>
                        <input name="phone" />
                      </label>

                      <label className="md:col-span-2">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Assign To</span>
                        <select name="assignedToId" defaultValue="">
                          <option value="">Auto-assign to current user</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="md:col-span-2">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Notes</span>
                        <textarea name="notes" rows={3} placeholder="Why this commenter is a high-value lead" />
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={isPending}>
                        {isPending ? 'Saving...' : 'Create Lead'}
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
