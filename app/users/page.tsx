import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { UserAdminPanel } from '@/components/users/user-admin-panel';
import { Card } from '@/components/ui/card';
import { canManageUsers } from '@/modules/users/permissions';
import { requireCurrentUserPage } from '@/modules/users/server';
import { listUsers } from '@/modules/users/services';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const currentUser = await requireCurrentUserPage();

  if (!canManageUsers(currentUser.role)) {
    redirect('/');
  }

  const users = await listUsers();

  return (
    <div className="space-y-10">
      <PageHeader
        title="User Management"
        subtitle="Create accounts and control role-based access for the shared organization workspace."
      />

      {users.length === 0 ? (
        <Card>
          <p className="text-sm text-[#A1A1AA]">No users found.</p>
        </Card>
      ) : null}

      <UserAdminPanel
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }))}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
