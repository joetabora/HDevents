'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { finalizeEventAction } from '@/modules/events/actions';

export function FinishEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  async function handleFinalize(formData: FormData) {
    setLoading(true);
    formData.set('eventId', eventId);
    const result = await finalizeEventAction(formData);

    if (!result.success) {
      toast.error(result.message);
      setLoading(false);
      return;
    }

    toast.success(result.message);
    router.refresh();
    setLoading(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <Button variant="primary" onClick={() => setConfirmOpen(true)}>
        Finalize Event
      </Button>

      <Transition appear show={confirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setConfirmOpen(false)}>
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
                <DialogPanel className="w-full max-w-md rounded-2xl border border-[#27272A] bg-[#18181B] p-6 shadow-2xl">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[#FF6A00]/20 p-2 text-[#FF8124]">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Finalize this event?</h3>
                      <p className="mt-1 text-sm text-[#A1A1AA]">
                        This will mark the event as completed and generate archive version files.
                      </p>
                    </div>
                  </div>

                  <form
                    className="mt-5 space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      handleFinalize(formData).catch(() => {
                        setLoading(false);
                        toast.error('Failed to finalize event');
                      });
                    }}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Final Attendance</span>
                        <input name="finalAttendance" type="number" min="0" step="1" />
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Final Budget Used</span>
                        <input name="finalBudgetUsed" type="number" min="0" step="0.01" />
                      </label>
                    </div>

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Final Notes</span>
                      <textarea name="finalNotes" rows={3} />
                    </label>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={loading}>
                        Confirm Finalize
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
