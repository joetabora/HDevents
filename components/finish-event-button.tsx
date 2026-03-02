'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function FinishEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  async function handleFinish() {
    setLoading(true);

    const response = await fetch(`/api/events/${eventId}/finish`, {
      method: 'POST'
    });

    if (!response.ok) {
      toast.error('Failed to finish event');
      setLoading(false);
      return;
    }

    const blob = await response.blob();
    const fileName = response.headers.get('x-report-filename') ?? 'event-report.pdf';
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Event finished and report downloaded');
    router.refresh();
    setLoading(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <Button variant="primary" onClick={() => setConfirmOpen(true)}>
        Finish Event
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
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Finish this event?</h3>
                      <p className="mt-1 text-sm text-[#A1A1AA]">
                        This marks the event as finished and generates the PDF closeout report.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      loading={loading}
                      onClick={() => {
                        handleFinish().catch(() => {
                          setLoading(false);
                          toast.error('Failed to finish event');
                        });
                      }}
                    >
                      Confirm Finish
                    </Button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
