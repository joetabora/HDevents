'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { categoryValues, categoryLabels } from '@/lib/utils/constants';

export function AddContactModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch('/api/contacts', {
      method: 'POST',
      body: formData
    });

    const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;

    if (!response.ok || !result?.success) {
      toast.error(result?.message ?? 'Failed to create contact');
      setIsSubmitting(false);
      return;
    }

    toast.success('Contact created');
    form.reset();
    setOpen(false);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Contact
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
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Add Contact</h3>
                      <p className="text-sm text-[#A1A1AA]">Create a reusable vendor contact profile.</p>
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
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Business Name</span>
                        <input name="businessName" required />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Category</span>
                        <select name="category" defaultValue={categoryValues[0]}>
                          {categoryValues.map((category) => (
                            <option key={category} value={category}>
                              {categoryLabels[category]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Contact Name</span>
                        <input name="contactName" />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Phone</span>
                        <input name="phone" />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Email</span>
                        <input type="email" name="email" />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Notes</span>
                        <textarea name="notes" rows={3} />
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Create Contact'}
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
