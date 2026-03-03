'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateSocialPostStatusAction } from '@/modules/social/actions';
import { SOCIAL_POST_STATUSES, type SocialPostStatus } from '@/lib/types/social';

export function SocialStatusSelect({
  postId,
  currentStatus,
  disabled = false
}: {
  postId: string;
  currentStatus: SocialPostStatus;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<SocialPostStatus>(currentStatus);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function updateStatus(nextStatus: SocialPostStatus) {
    setStatus(nextStatus);
    setIsPending(true);

    const formData = new FormData();
    formData.set('id', postId);
    formData.set('status', nextStatus);

    const result = await updateSocialPostStatusAction(formData);

    if (!result.success) {
      setStatus(currentStatus);
      toast.error(result.message);
      setIsPending(false);
      return;
    }

    toast.success(result.message);
    router.refresh();
    setIsPending(false);
  }

  return (
    <select
      value={status}
      disabled={isPending || disabled}
      onChange={(event) => {
        updateStatus(event.target.value as SocialPostStatus).catch(() => {
          setIsPending(false);
          toast.error('Unable to update post status');
        });
      }}
      className="w-36 border-[#27272A] bg-[#111113] text-[#FAFAFA]"
    >
      {SOCIAL_POST_STATUSES.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}
