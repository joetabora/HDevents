'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleTaskCompleteAction } from '@/modules/tasks/actions';

export function TaskCompleteToggle({ taskId, completed, disabled = false }: { taskId: string; completed: boolean; disabled?: boolean }) {
  const [isPending, setIsPending] = useState(false);
  const [localValue, setLocalValue] = useState(completed);
  const router = useRouter();

  async function onToggle(nextValue: boolean) {
    setLocalValue(nextValue);
    setIsPending(true);

    const formData = new FormData();
    formData.set('taskId', taskId);
    formData.set('completed', String(nextValue));

    const result = await toggleTaskCompleteAction(formData);

    if (!result.success) {
      setLocalValue(completed);
      toast.error(result.message);
      setIsPending(false);
      return;
    }

    toast.success(result.message);
    setIsPending(false);
    router.refresh();
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs text-[#A1A1AA]">
      <input
        type="checkbox"
        checked={localValue}
        disabled={isPending || disabled}
        onChange={(event) => {
          onToggle(event.target.checked).catch(() => {
            toast.error('Unable to update task');
            setIsPending(false);
          });
        }}
        className="h-4 w-4"
      />
      Completed
    </label>
  );
}
