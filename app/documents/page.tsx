import Link from 'next/link';
import { FileStack } from 'lucide-react';
import { UploadDocumentButton } from '@/components/documents/upload-document-button';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/format';
import { listGlobalDocuments } from '@/modules/documents/services';
import { canEditContent } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';

export const dynamic = 'force-dynamic';

export default async function DocumentCenterPage({
  searchParams
}: {
  searchParams?: { type?: string; relatedId?: string; q?: string };
}) {
  const user = await requireCurrentUserPage();
  const allowEdits = canEditContent(user.role);
  const relatedType = searchParams?.type?.trim().toUpperCase() || '';
  const relatedId = searchParams?.relatedId?.trim() || '';
  const q = searchParams?.q?.trim() || '';

  const documents = await listGlobalDocuments({
    relatedType,
    relatedId,
    search: q
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Document Center"
        subtitle="Global files across events, vendors, and social operations."
        right={allowEdits ? <UploadDocumentButton /> : null}
      />

      <Card>
        <form className="grid gap-3 md:grid-cols-4" action="/documents" method="get">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Type</span>
            <select name="type" defaultValue={relatedType || ''}>
              <option value="">All</option>
              <option value="EVENT">Event</option>
              <option value="VENDOR">Vendor</option>
              <option value="SOCIAL">Social Post</option>
              <option value="GENERAL">General</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Related ID</span>
            <input name="relatedId" defaultValue={relatedId} />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">Search</span>
            <input name="q" defaultValue={q} />
          </label>

          <div className="flex items-end gap-2">
            <Button type="submit" variant="primary">
              Apply
            </Button>
            <Link href="/documents">
              <Button type="button" variant="secondary">Reset</Button>
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <FileStack className="h-4 w-4 text-[#FF8124]" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Documents</h2>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">No documents found for this filter.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.id} className="rounded-2xl border border-[#27272A] bg-[#111113] px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#FAFAFA]">{document.name}</p>
                    <p className="mt-1 text-xs text-[#A1A1AA]">
                      {document.relatedType}
                      {document.relatedId ? ` • ${document.relatedId}` : ''}
                      {document.uploadedBy ? ` • Uploaded by ${document.uploadedBy.name}` : ''}
                      {` • ${formatDate(document.uploadedAt)}`}
                    </p>
                  </div>
                  <a
                    href={`/api/global-documents/${document.id}/download`}
                    target="_blank"
                    className="text-xs font-semibold text-[#FF8124] hover:text-[#FF6A00]"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
