import { Cog } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { canManageUsers } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';

export default async function SettingsPage() {
  const user = await requireCurrentUserPage();
  const allowUserAdmin = canManageUsers(user.role);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Settings"
        subtitle="Placeholder for future modules including marketing, social scheduling, automation, and analytics."
      />

      <Card className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#FF6A00]/15 p-2 text-[#FF8124]">
          <Cog className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-[#FAFAFA]">Module Expansion Ready</p>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            This area is intentionally reserved for configuration and future feature toggles.
          </p>
          {allowUserAdmin ? (
            <div className="mt-3">
              <Link href="/users">
                <Button variant="secondary">Manage Users</Button>
              </Link>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
