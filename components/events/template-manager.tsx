'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, FilePlus2, Package, Pencil, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eventTypeLabels, eventTypeValues } from '@/lib/utils/constants';
import {
  archiveEventTemplateAction,
  createEventFromTemplateAction,
  duplicateEventTemplateAction,
  updateEventTemplateAction
} from '@/modules/events/template-actions';

type TemplateManagerRow = {
  id: string;
  name: string;
  description: string | null;
  eventType: 'RALLY' | 'OPEN_HOUSE' | 'COMMUNITY' | 'DEMO_DAY' | 'SEASONAL' | 'OTHER' | null;
  budgetCategories: Array<{ category: string; estimate: number }>;
  taskChecklist: string[];
  timelineMilestones: string[];
  createdAt: string;
  archivedAt: string | null;
  usageCount: number;
  lastUsedDate: string | null;
  vendors: Array<{
    id: string;
    vendorId: string;
    priorityLevel: 'PRIMARY' | 'BACKUP';
    defaultCostEstimate: number | null;
    category: string;
    vendor: { id: string; businessName: string; category: string; contactName: string | null };
    suggestedByHistory: boolean;
    usageCountForType: number;
  }>;
};

export function TemplateManager({
  templates,
  users,
  canManage
}: {
  templates: TemplateManagerRow[];
  users: Array<{ id: string; name: string; email: string }>;
  canManage: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();

  async function runAction<T extends { success: boolean; message: string; eventId?: string }>(
    id: string,
    action: Promise<T>,
    onSuccess?: (result: T) => void
  ) {
    setPendingId(id);
    const result = await action;
    setPendingId(null);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    onSuccess?.(result);
    router.refresh();
  }

  if (templates.length === 0) {
    return (
      <article className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <p className="text-sm text-[#A1A1AA]">No templates yet. Save any event as template to start a repeatable framework.</p>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => {
        const primaryVendors = template.vendors.filter((vendor) => vendor.priorityLevel === 'PRIMARY');
        const backupVendors = template.vendors.filter((vendor) => vendor.priorityLevel === 'BACKUP');

        return (
          <article key={template.id} className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#FAFAFA]">{template.name}</h3>
                <p className="mt-1 text-sm text-[#A1A1AA]">{template.description || 'No description provided.'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                  <span className="rounded-full border border-[#27272A] px-2 py-0.5">Usage: {template.usageCount}</span>
                  <span className="rounded-full border border-[#27272A] px-2 py-0.5">
                    Last Used: {template.lastUsedDate ? new Date(template.lastUsedDate).toLocaleDateString() : 'Never'}
                  </span>
                  <span className="rounded-full border border-[#27272A] px-2 py-0.5">Vendors: {template.vendors.length}</span>
                  <span className="rounded-full border border-[#27272A] px-2 py-0.5">Tasks: {template.taskChecklist.length}</span>
                  <span className="rounded-full border border-[#27272A] px-2 py-0.5">
                    Type: {template.eventType ? eventTypeLabels[template.eventType] : 'Unspecified'}
                  </span>
                  {template.archivedAt ? <span className="rounded-full border border-rose-500/40 px-2 py-0.5 text-rose-300">Archived</span> : null}
                </div>
              </div>

              {canManage ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    loading={pendingId === `duplicate-${template.id}`}
                    onClick={() => {
                      const formData = new FormData();
                      formData.set('templateId', template.id);
                      void runAction(`duplicate-${template.id}`, duplicateEventTemplateAction(formData));
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>

                  {!template.archivedAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      loading={pendingId === `archive-${template.id}`}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set('templateId', template.id);
                        void runAction(`archive-${template.id}`, archiveEventTemplateAction(formData));
                      }}
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <details className="mt-4 rounded-2xl border border-[#27272A] bg-[#0f0f11] p-4" open={canManage}>
              <summary className="cursor-pointer text-sm font-semibold text-[#FAFAFA]">
                <span className="inline-flex items-center gap-2">
                  <FilePlus2 className="h-4 w-4 text-[#FF8124]" />
                  Create Event from Template
                </span>
              </summary>

              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!canManage) {
                    return;
                  }
                  const formData = new FormData(event.currentTarget);
                  formData.set('templateId', template.id);
                  void runAction(`create-${template.id}`, createEventFromTemplateAction(formData), (result) => {
                    if (result.eventId) {
                      router.push(`/events/${result.eventId}`);
                    }
                  });
                }}
              >
                <div className="grid gap-3 md:grid-cols-4">
                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Event Name</span>
                    <input name="name" required defaultValue={`${template.name} ${new Date().getFullYear()}`} />
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
                    <select name="eventType" defaultValue={template.eventType ?? ''}>
                      <option value="">Unspecified</option>
                      {eventTypeValues.map((value) => (
                        <option key={value} value={value}>
                          {eventTypeLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block max-w-sm">
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Auto-Added Primary Vendors</h4>
                    <ul className="mt-2 space-y-1 text-sm text-[#A1A1AA]">
                      {primaryVendors.map((vendor) => (
                        <li key={vendor.id}>
                          {vendor.vendor.businessName} ({vendor.category}) {vendor.defaultCostEstimate ? `- $${vendor.defaultCostEstimate.toFixed(2)}` : ''}
                        </li>
                      ))}
                      {primaryVendors.length === 0 ? <li>No primary vendors configured.</li> : null}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Backup Vendor Suggestions</h4>
                    <div className="mt-2 space-y-1 text-sm text-[#A1A1AA]">
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
                            {vendor.vendor.businessName} ({vendor.category}) {vendor.suggestedByHistory ? `- suggested (${vendor.usageCountForType}x)` : ''}
                          </span>
                        </label>
                      ))}
                      {backupVendors.length === 0 ? <p>No backup vendors configured.</p> : null}
                    </div>
                  </div>
                </div>

                {canManage ? (
                  <Button type="submit" variant="primary" loading={pendingId === `create-${template.id}`}>
                    Create Event
                  </Button>
                ) : (
                  <p className="text-xs text-[#A1A1AA]">Read-only access. Editors/Admins can create events from templates.</p>
                )}
              </form>
            </details>

            {canManage ? (
              <details className="mt-3 rounded-2xl border border-[#27272A] bg-[#0f0f11] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#FAFAFA]">
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-[#FF8124]" />
                    Edit Template
                  </span>
                </summary>

                <form
                  className="mt-4 space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    formData.set('templateId', template.id);
                    void runAction(`edit-${template.id}`, updateEventTemplateAction(formData));
                  }}
                >
                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Name</span>
                    <input name="name" defaultValue={template.name} required />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Description</span>
                    <textarea name="description" rows={2} defaultValue={template.description ?? ''} />
                  </label>

                  <label className="block max-w-sm">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Event Type</span>
                    <select name="eventType" defaultValue={template.eventType ?? ''}>
                      <option value="">Unspecified</option>
                      {eventTypeValues.map((value) => (
                        <option key={value} value={value}>
                          {eventTypeLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Budget Categories (CATEGORY:AMOUNT)</span>
                    <textarea
                      name="budgetCategoriesText"
                      rows={4}
                      defaultValue={template.budgetCategories.map((row) => `${row.category}:${row.estimate}`).join('\n')}
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Task Checklist (one per line)</span>
                    <textarea name="taskChecklistText" rows={5} defaultValue={template.taskChecklist.join('\n')} />
                  </label>

                  <label>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Timeline Milestones (one per line)</span>
                    <textarea name="timelineMilestonesText" rows={4} defaultValue={template.timelineMilestones.join('\n')} />
                  </label>

                  <Button type="submit" variant="secondary" loading={pendingId === `edit-${template.id}`}>
                    Save Template Changes
                  </Button>
                </form>
              </details>
            ) : null}

            <div className="mt-3 rounded-2xl border border-[#27272A] bg-[#0f0f11] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">
                <span className="inline-flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#FF8124]" />
                  Vendor Stack
                </span>
              </p>
              <ul className="mt-2 grid gap-1 text-sm text-[#A1A1AA] md:grid-cols-2">
                {template.vendors.map((vendor) => (
                  <li key={vendor.id}>
                    {vendor.vendor.businessName} - {vendor.priorityLevel} - {vendor.category}
                  </li>
                ))}
                {template.vendors.length === 0 ? <li>No vendors configured.</li> : null}
              </ul>
            </div>
          </article>
        );
      })}
    </div>
  );
}
