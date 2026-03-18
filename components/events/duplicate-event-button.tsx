'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Copy, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { duplicateEventAction } from '@/modules/events/template-actions';

function toDateInputValue(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function DuplicateEventButton({
  event,
  users,
  compact = false
}: {
  event: { id: string; name: string; date: string | Date; budget: number; assignedToId?: string | null };
  users: Array<{ id: string; name: string; email: string }>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setIsPending(true);
    const result = await duplicateEventAction(formData);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setOpen(false);
    if (result.eventId) {
      router.push(`/events/${result.eventId}`);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="secondary" className={compact ? 'px-3 py-1.5' : ''} onClick={() => setOpen(true)}>
        <Copy className="h-4 w-4" />
        Duplicate
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
                      <h3 className="text-lg font-semibold text-[#FAFAFA]">Duplicate Event</h3>
                      <p className="text-sm text-[#A1A1AA]">Copy this event’s structure, vendors, tasks, and playbook into a new planning event.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-xl p-2 text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={(eventValue) => {
                      eventValue.preventDefault();
                      const formData = new FormData(eventValue.currentTarget);
                      void onSubmit(formData);
                    }}
                    className="space-y-4"
                  >
                    <input type="hidden" name="eventId" value={event.id} />

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">New Event Name</span>
                      <input name="name" defaultValue={`${event.name} Copy`} required />
                    </label>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Date</span>
                        <input name="date" type="date" defaultValue={toDateInputValue(event.date)} required />
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Budget</span>
                        <input name="budget" type="number" min="0" step="0.01" defaultValue={event.budget} required />
                      </label>

                      <label>
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Assign To</span>
                        <select name="assignedToId" defaultValue={event.assignedToId ?? ''}>
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={isPending}>
                        Duplicate Event
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
