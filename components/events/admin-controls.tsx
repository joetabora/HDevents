'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { regenerateEventArchiveAction, reopenEventAction } from '@/modules/events/actions';

export function AdminControls({ eventId, editingEnabled }: { eventId: string; editingEnabled: boolean }) {
  const [reopenLoading, setReopenLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function enableEditing() {
    if (editingEnabled) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.set('edit', '1');
    router.replace(`${pathname}?${next.toString()}`);
  }

  async function handleReopen() {
    setReopenLoading(true);
    const formData = new FormData();
    formData.set('eventId', eventId);
    const result = await reopenEventAction(formData);
    setReopenLoading(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.replace(pathname);
    router.refresh();
  }

  async function handleRegenerate() {
    setRegenerateLoading(true);
    const formData = new FormData();
    formData.set('eventId', eventId);
    const result = await regenerateEventArchiveAction(formData);
    setRegenerateLoading(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Administrative Controls</h2>
      <p className="mt-1 text-xs text-[#A1A1AA]">Completed events can be corrected by admins and re-archived as new versions.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" loading={reopenLoading} onClick={() => void handleReopen()}>
          Reopen Event
        </Button>
        <Button type="button" variant="secondary" disabled={editingEnabled} onClick={enableEditing}>
          {editingEnabled ? 'Editing Enabled' : 'Enable Editing'}
        </Button>
        <Button type="button" variant="primary" loading={regenerateLoading} onClick={() => void handleRegenerate()}>
          Regenerate Archive
        </Button>
      </div>
    </section>
  );
}
