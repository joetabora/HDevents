'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { USER_DEPARTMENTS, USER_ROLES, type UserDepartment, type UserRole } from '@/modules/users/constants';
import { createUserAction, deleteUserAction, resetUserPasswordAction, updateUserRoleAction } from '@/modules/users/actions';

export function UserAdminPanel({
  users,
  currentUserId
}: {
  users: Array<{ id: string; name: string; email: string; role: UserRole; department: UserDepartment }>;
  currentUserId: string;
}) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const router = useRouter();

  async function runAction(action: Promise<{ success: boolean; message: string }>, userId?: string) {
    setPendingUserId(userId ?? 'create');
    const result = await action;

    if (!result.success) {
      toast.error(result.message);
      setPendingUserId(null);
      return;
    }

    toast.success(result.message);
    setPendingUserId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <article className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FAFAFA]">Create User</h2>
        <form
          className="mt-3 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            runAction(createUserAction(formData));
          }}
        >
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />

          <select name="role" defaultValue="VIEWER">
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select name="department" defaultValue="ADMIN">
            {USER_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <Button type="submit" loading={pendingUserId === 'create'}>
            Create User
          </Button>
        </form>
      </article>

      {users.map((user) => (
        <article key={user.id} className="rounded-2xl border border-[#27272A] bg-[#111113] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#FAFAFA]">{user.name}</p>
              <p className="mt-1 text-xs text-[#A1A1AA]">{user.email}</p>
            </div>
            <span className="rounded-full border border-[#27272A] px-2 py-0.5 text-xs text-[#FF8124]">{user.role}</span>
          </div>

          <form
            className="mt-3 grid gap-2 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              formData.set('userId', user.id);
              runAction(updateUserRoleAction(formData), user.id);
            }}
          >
            <input type="hidden" name="userId" value={user.id} />

            <select name="role" defaultValue={user.role}>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <select name="department" defaultValue={user.department}>
              {USER_DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            <Button type="submit" variant="secondary" loading={pendingUserId === user.id}>
              Save Access
            </Button>
          </form>

          <form
            className="mt-3 grid gap-2 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              formData.set('userId', user.id);
              runAction(resetUserPasswordAction(formData), `pw-${user.id}`);
            }}
          >
            <input type="hidden" name="userId" value={user.id} />
            <input name="password" type="password" placeholder="New Password" required />
            <Button type="submit" variant="secondary" loading={pendingUserId === `pw-${user.id}`}>
              Reset Password
            </Button>
          </form>

          <div className="mt-3">
            <Button
              type="button"
              variant="danger"
              disabled={user.id === currentUserId}
              loading={pendingUserId === `delete-${user.id}`}
              onClick={() => {
                const confirmed = window.confirm('Delete this user?');
                if (!confirmed) {
                  return;
                }

                const formData = new FormData();
                formData.set('userId', user.id);
                runAction(deleteUserAction(formData), `delete-${user.id}`);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete User
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
