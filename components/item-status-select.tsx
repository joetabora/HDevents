'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { type ItemStatus } from '@/lib/types/domain';
import { itemStatusValues, statusLabels } from '@/lib/utils/constants';

export function ItemStatusSelect({
  itemId,
  currentStatus,
  disabled = false
}: {
  itemId: string;
  currentStatus: ItemStatus;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<ItemStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(nextStatus: ItemStatus) {
    setValue(nextStatus);
    setLoading(true);

    const response = await fetch(`/api/items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      setValue(currentStatus);
      toast.error('Unable to update status');
      setLoading(false);
      return;
    }

    router.refresh();
    toast.success('Status updated');
    setLoading(false);
  }

  return (
    <select
      value={value}
      disabled={loading || disabled}
      onChange={(event) => {
        handleChange(event.target.value as ItemStatus).catch(() => {
          setLoading(false);
          toast.error('Unable to update status');
        });
      }}
      className="min-w-40 border-[#27272A] bg-[#111113] text-[#FAFAFA]"
    >
      {itemStatusValues.map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}
