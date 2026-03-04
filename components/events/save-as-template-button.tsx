'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { saveEventAsTemplateAction } from '@/modules/events/template-actions';

export function SaveAsTemplateButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    formData.set('eventId', eventId);

    const result = await saveEventAsTemplateAction(formData);
    setSaving(false);

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
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Save as Template
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
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Save Event as Template</h3>
                      <p className="text-sm text-[#A1A1AA]">Capture vendor, budget category, checklist, and milestone defaults.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-xl p-2 text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Template Name</span>
                      <input name="name" defaultValue={`${eventName} Template`} required />
                    </label>

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Description</span>
                      <textarea name="description" rows={3} placeholder="Reusable framework notes..." />
                    </label>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={saving}>
                        {saving ? 'Saving...' : 'Save Template'}
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
