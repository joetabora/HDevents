'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadGlobalDocumentAction } from '@/modules/documents/actions';

const RELATED_TYPES = ['EVENT', 'VENDOR', 'SOCIAL', 'GENERAL'] as const;

export function UploadDocumentButton() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await uploadGlobalDocumentAction(formData);

    if (!result.success) {
      toast.error(result.message);
      setIsPending(false);
      return;
    }

    toast.success(result.message);
    setIsPending(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Upload Document
      </Button>

      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/65 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-linear duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-linear duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-xl rounded-2xl border border-[#27272A] bg-[#18181B] p-6 shadow-2xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Upload Global Document</h3>
                      <p className="text-sm text-[#A1A1AA]">Store files against events, vendors, or social posts.</p>
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
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Name</span>
                      <input name="name" required />
                    </label>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Related Type</span>
                        <select name="relatedType" defaultValue="GENERAL">
                          {RELATED_TYPES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Related ID (Optional)</span>
                        <input name="relatedId" />
                      </label>
                    </div>

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">File</span>
                      <input type="file" name="file" required />
                    </label>

                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={isPending}>
                        {isPending ? 'Uploading...' : 'Upload'}
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
