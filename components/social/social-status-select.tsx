'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { SOCIAL_POST_STATUSES, type SocialPostStatus } from '@/lib/types/social';

export function SocialStatusSelect({ postId, currentStatus }: { postId: string; currentStatus: SocialPostStatus }) {
  const [status, setStatus] = useState<SocialPostStatus>(currentStatus);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function updateStatus(nextStatus: SocialPostStatus) {
    setStatus(nextStatus);
    setIsPending(true);

    const response = await fetch(`/api/social/posts/${postId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      setStatus(currentStatus);
      toast.error('Unable to update post status');
      setIsPending(false);
      return;
    }

    toast.success('Post status updated');
    router.refresh();
    setIsPending(false);
  }

  return (
    <select
      value={status}
      disabled={isPending}
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
