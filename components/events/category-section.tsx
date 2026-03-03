'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileCheck, Layers, Music, Paperclip, ShoppingBag, Utensils } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AddItemModal } from '@/components/modals/add-item-modal';
import { NewTaskButton } from '@/components/tasks/new-task-button';
import { StatusBadge } from '@/components/status-badge';
import { ItemStatusSelect } from '@/components/item-status-select';
import { Card } from '@/components/ui/card';
import { type Category } from '@/lib/types/domain';
import { formatCurrency } from '@/lib/utils/format';
import { parseItemStatus } from '@/modules/events/validators';

const categoryIcons = {
  FOOD: Utensils,
  ENTERTAINMENT: Music,
  MERCH: ShoppingBag,
  PERMIT: FileCheck,
  MISC: Layers
} as const;

type ContactOption = {
  id: string;
  businessName: string;
  category: Category;
  contactName: string | null;
};

type ItemRow = {
  id: string;
  name: string;
  fee: number;
  status: string;
  notes: string | null;
  contact: { businessName: string; contactName: string | null } | null;
  documents: Array<{ id: string; fileName: string }>;
};

export function CategorySection({
  category,
  title,
  items,
  total,
  eventId,
  contacts,
  canEdit = true,
  canDelete = true,
  taskUsers = [],
  onDocumentDeleted
}: {
  category: Category;
  title: string;
  items: ItemRow[];
  total: number;
  eventId: string;
  contacts: ContactOption[];
  canEdit?: boolean;
  canDelete?: boolean;
  taskUsers?: Array<{ id: string; name: string; email: string }>;
  onDocumentDeleted?: () => void;
}) {
  const Icon = categoryIcons[category];
  const router = useRouter();

  async function handleDeleteDocument(documentId: string) {
    const response = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });

    if (!response.ok) {
      toast.error('Failed to delete document');
      return;
    }

    toast.success('Document deleted');
    onDocumentDeleted?.();
    router.refresh();
  }

  return (
    <Card className="bg-[#18181B]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#FF6A00]/15 p-2 text-[#FF8124]">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FAFAFA]">{title}</h2>
            <p className="text-xs text-[#A1A1AA]">
              {items.length} item(s) | {formatCurrency(total)}
            </p>
          </div>
        </div>
        {canEdit ? <AddItemModal eventId={eventId} category={category} contacts={contacts} /> : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#27272A] p-6 text-sm text-[#A1A1AA]">No items in this section.</div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item, index) => {
            const parsedStatus = parseItemStatus(item.status);

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="rounded-2xl border border-[#27272A] bg-[#111113] p-4 transition duration-200 ease-in-out hover:border-[#3f3f46] hover:bg-[#151518]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-[#FAFAFA]">{item.name}</p>
                      <StatusBadge status={parsedStatus} />
                    </div>
                    <p className="mt-1 text-sm text-[#A1A1AA]">
                      {item.contact
                        ? `${item.contact.businessName}${item.contact.contactName ? ` (${item.contact.contactName})` : ''}`
                        : 'No contact linked'}
                    </p>
                    {item.notes ? <p className="mt-1 text-sm text-[#A1A1AA]">{item.notes}</p> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <ItemStatusSelect itemId={item.id} currentStatus={parsedStatus} disabled={!canEdit} />
                    {canEdit ? (
                      <NewTaskButton
                        label="Task"
                        compact
                        relatedType="VENDOR"
                        relatedId={item.id}
                        users={taskUsers}
                      />
                    ) : null}
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-[#A1A1AA]">Fee</p>
                      <p className="text-base font-semibold text-[#FAFAFA]">{formatCurrency(item.fee)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#27272A] bg-[#0f0f11] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-[#A1A1AA]">
                    <Paperclip className="h-3.5 w-3.5" /> Attachments ({item.documents.length})
                  </div>

                  {item.documents.length === 0 ? (
                    <p className="text-sm text-[#A1A1AA]">No attachments</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {item.documents.map((document) => (
                        <li key={document.id} className="flex items-center justify-between gap-2">
                          <Link
                            href={`/api/documents/${document.id}/download`}
                            target="_blank"
                            className="truncate text-[#FF8124] hover:text-[#FF6A00]"
                          >
                            {document.fileName}
                          </Link>
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteDocument(document.id).catch(() => {
                                  toast.error('Failed to delete document');
                                });
                              }}
                              className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                            >
                              Delete
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
