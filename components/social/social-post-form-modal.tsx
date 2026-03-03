'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { createSocialPostAction, updateSocialPostAction } from '@/modules/social/actions';
import { SOCIAL_PLATFORMS, SOCIAL_POST_STATUSES, SOCIAL_POST_TYPES } from '@/lib/types/social';
import { Button } from '@/components/ui/button';

type SocialPostFormData = {
  id: string;
  title: string;
  type: string;
  status: string;
  platforms: string[];
  caption: string | null;
  hashtags: string | null;
  scheduledFor: Date | string | null;
};

function toDateTimeLocalValue(value: Date | string | null): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 16);
}

export function SocialPostFormModal({
  open,
  onClose,
  initialPost
}: {
  open: boolean;
  onClose: () => void;
  initialPost?: SocialPostFormData;
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const isEditing = Boolean(initialPost);
  const selectedPlatforms = useMemo(() => new Set(initialPost?.platforms ?? ['FACEBOOK']), [initialPost]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (isEditing && initialPost?.id) {
      formData.set('id', initialPost.id);
    }

    const result = isEditing ? await updateSocialPostAction(formData) : await createSocialPostAction(formData);

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
              <DialogPanel className="w-full max-w-2xl rounded-2xl border border-[#27272A] bg-[#18181B] p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#FAFAFA]">{isEditing ? 'Edit Post' : 'New Post'}</h3>
                    <p className="text-sm text-[#A1A1AA]">Social content pipeline entry</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl p-2 text-[#A1A1AA] hover:bg-[#111113] hover:text-[#FAFAFA]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Title</span>
                      <input name="title" required defaultValue={initialPost?.title ?? ''} />
                    </label>

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Type</span>
                      <select name="type" defaultValue={initialPost?.type ?? 'USED_BIKE'}>
                        {SOCIAL_POST_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Status</span>
                      <select name="status" defaultValue={initialPost?.status ?? 'IDEA'}>
                        {SOCIAL_POST_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Scheduled Date</span>
                      <input type="datetime-local" name="scheduledFor" defaultValue={toDateTimeLocalValue(initialPost?.scheduledFor ?? null)} />
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Caption</span>
                      <textarea name="caption" rows={3} defaultValue={initialPost?.caption ?? ''} />
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Hashtags</span>
                      <textarea name="hashtags" rows={2} defaultValue={initialPost?.hashtags ?? ''} />
                    </label>
                  </div>

                  <fieldset>
                    <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Platforms</legend>
                    <div className="flex flex-wrap gap-2">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <label key={platform} className="inline-flex items-center gap-2 rounded-2xl border border-[#27272A] bg-[#111113] px-3 py-2 text-sm text-[#FAFAFA]">
                          <input
                            type="checkbox"
                            name="platforms"
                            value={platform}
                            className="h-4 w-4"
                            defaultChecked={selectedPlatforms.has(platform)}
                          />
                          {platform}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isPending}>
                      {isPending ? 'Saving...' : 'Save Post'}
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
