'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { CalendarClock, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { INTERACTION_TYPES } from '@/lib/types/crm';
import { addInteractionAction } from '@/modules/contacts/actions';

export function QuickAddInteractionModal({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set('contactId', contactId);
    const result = await addInteractionAction(formData);

    setLoading(false);

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
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Quick Add Interaction
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
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Add Interaction</h3>
                      <p className="text-sm text-[#A1A1AA]">Capture outreach and optionally schedule follow-up automation.</p>
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
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Type</span>
                      <select name="type" defaultValue="NOTE">
                        {INTERACTION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Summary</span>
                      <textarea name="summary" rows={4} required />
                    </label>

                    <label>
                      <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Follow-up Date
                      </span>
                      <input type="datetime-local" name="followUpDate" />
                    </label>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={loading}>
                        {loading ? 'Saving...' : 'Save Interaction'}
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
