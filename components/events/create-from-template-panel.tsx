'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { eventTypeLabels, eventTypeValues } from '@/lib/utils/constants';
import { createEventFromTemplateAction } from '@/modules/events/template-actions';

type TemplateOption = {
  id: string;
  name: string;
  description: string | null;
  eventType: 'RALLY' | 'OPEN_HOUSE' | 'COMMUNITY' | 'DEMO_DAY' | 'SEASONAL' | 'OTHER' | null;
  vendors: Array<{
    id: string;
    vendorId: string;
    priorityLevel: 'PRIMARY' | 'BACKUP';
    category: string;
    vendor: { businessName: string };
    suggestedByHistory: boolean;
    usageCountForType: number;
  }>;
};

export function CreateFromTemplatePanel({
  templates,
  users
}: {
  templates: TemplateOption[];
  users: Array<{ id: string; name: string; email: string }>;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const primaryVendors = selectedTemplate?.vendors.filter((vendor) => vendor.priorityLevel === 'PRIMARY') ?? [];
  const backupVendors = selectedTemplate?.vendors.filter((vendor) => vendor.priorityLevel === 'BACKUP') ?? [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTemplateId) {
      toast.error('Select a template first');
      return;
    }

    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    formData.set('templateId', selectedTemplateId);

    const result = await createEventFromTemplateAction(formData);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    if (result.eventId) {
      router.push(`/events/${result.eventId}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-[#FF6A00]/30 bg-[#FF6A00]/10 p-2 text-[#FF8124]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Create From Template</h2>
          <p className="mt-1 text-sm text-[#A1A1AA]">Start from a repeatable event framework with vendors, checklist defaults, and milestone tasks preloaded.</p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Template</span>
          <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
            <option value="">Select template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        {selectedTemplate ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Event Name</span>
                <input name="name" required defaultValue={`${selectedTemplate.name} ${new Date().getFullYear()}`} />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Date</span>
                <input name="date" type="date" required />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Budget</span>
                <input name="budget" type="number" min="0" step="0.01" required />
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Event Type</span>
                <select name="eventType" defaultValue={selectedTemplate.eventType ?? ''}>
                  <option value="">Unspecified</option>
                  {eventTypeValues.map((value) => (
                    <option key={value} value={value}>
                      {eventTypeLabels[value]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Assign To</span>
                <select name="assignedToId" defaultValue="">
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Primary Vendors</h3>
                <ul className="mt-3 space-y-1 text-sm text-[#A1A1AA]">
                  {primaryVendors.map((vendor) => (
                    <li key={vendor.id}>
                      {vendor.vendor.businessName} • {vendor.category}
                    </li>
                  ))}
                  {primaryVendors.length === 0 ? <li>No primary vendors configured.</li> : null}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Backup Suggestions</h3>
                <div className="mt-3 space-y-2 text-sm text-[#A1A1AA]">
                  {backupVendors.map((vendor) => (
                    <label key={vendor.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="backupVendorIds"
                        value={vendor.vendorId}
                        defaultChecked={vendor.suggestedByHistory}
                        className="h-4 w-4 rounded border-[#3f3f46] bg-[#18181B]"
                      />
                      <span>
                        {vendor.vendor.businessName} • {vendor.category}
                        {vendor.suggestedByHistory ? ` • suggested (${vendor.usageCountForType}x)` : ''}
                      </span>
                    </label>
                  ))}
                  {backupVendors.length === 0 ? <p>No backup vendors configured.</p> : null}
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={isPending}>
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
}
