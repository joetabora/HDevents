import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { EventsNav } from '@/components/events/events-nav';
import { TemplateManager } from '@/components/events/template-manager';
import { canEditContent } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUserOptions } from '@/modules/users/services';
import { listEventTemplates } from '@/modules/events/templates';

export const dynamic = 'force-dynamic';

export default async function EventTemplatesPage() {
  const currentUser = await requireCurrentUserPage();
  const canManage = canEditContent(currentUser.role);

  const [templates, users] = await Promise.all([
    listEventTemplates({ includeArchived: canManage }),
    canManage ? listUserOptions() : Promise.resolve([])
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Event Templates"
        subtitle="Reusable event frameworks with vendor auto-fill, checklist defaults, and timeline milestones."
      />

      <EventsNav />

      {!canManage ? (
        <Card>
          <p className="text-sm text-[#A1A1AA]">Read-only access enabled for your role.</p>
        </Card>
      ) : null}

      <TemplateManager
        templates={templates.map((template) => ({
          ...template,
          createdAt: template.createdAt.toISOString(),
          archivedAt: template.archivedAt ? template.archivedAt.toISOString() : null,
          lastUsedDate: template.lastUsedDate ? template.lastUsedDate.toISOString() : null,
          vendors: template.vendors.map((vendor) => ({
            ...vendor
          }))
        }))}
        users={users}
        canManage={canManage}
      />
    </div>
  );
}
