'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { updateSocialPostPerformanceAction } from '@/modules/social/actions';
import { Button } from '@/components/ui/button';

export function SocialPerformanceModal({
  open,
  onClose,
  post
}: {
  open: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('id', post.id);

    const result = await updateSocialPostPerformanceAction(formData);

    if (!result.success) {
      toast.error(result.message);
      setIsPending(false);
      return;
    }

    toast.success(result.message);
    setIsPending(false);
    onClose();
    router.refresh();
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <DialogPanel className="w-full max-w-lg rounded-2xl border border-[#27272A] bg-[#18181B] p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#FAFAFA]">Performance</h3>
                    <p className="text-sm text-[#A1A1AA]">{post.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl p-2 text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Likes</span>
                    <input type="number" min="0" name="likes" defaultValue={post.likes} />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Comments</span>
                    <input type="number" min="0" name="comments" defaultValue={post.comments} />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Shares</span>
                    <input type="number" min="0" name="shares" defaultValue={post.shares} />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Views</span>
                    <input type="number" min="0" name="views" defaultValue={post.views} />
                  </label>

                  <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isPending}>
                      {isPending ? 'Saving...' : 'Save Performance'}
                    </Button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
