'use server';

import { revalidatePath } from 'next/cache';
import { parseUserDepartment, parseUserRole } from './constants';
import { createUser, deleteUser, updateUserPassword, updateUserRoleAndDepartment } from './services';
import { requireManageUsersPermission } from './server';

function revalidateUserPaths() {
  revalidatePath('/users');
  revalidatePath('/settings');
}

export async function createUserAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    await requireManageUsersPermission();

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '').trim();
    const role = parseUserRole(String(formData.get('role') ?? 'VIEWER'));
    const department = parseUserDepartment(String(formData.get('department') ?? 'ADMIN'));

    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    await createUser({
      name,
      email,
      password,
      role,
      department
    });

    revalidateUserPaths();

    return { success: true, message: 'User created' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create user' };
  }
}

export async function updateUserRoleAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    await requireManageUsersPermission();

    const userId = String(formData.get('userId') ?? '').trim();
    const role = parseUserRole(String(formData.get('role') ?? 'VIEWER'));
    const department = parseUserDepartment(String(formData.get('department') ?? 'ADMIN'));

    if (!userId) {
      throw new Error('User id is required');
    }

    await updateUserRoleAndDepartment({ userId, role, department });

    revalidateUserPaths();

    return { success: true, message: 'User updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update user' };
  }
}

export async function resetUserPasswordAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    await requireManageUsersPermission();

    const userId = String(formData.get('userId') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();

    if (!userId || !password) {
      throw new Error('User id and password are required');
    }

    await updateUserPassword({ userId, password });

    revalidateUserPaths();

    return { success: true, message: 'Password reset' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to reset password' };
  }
}

export async function deleteUserAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await requireManageUsersPermission();

    const userId = String(formData.get('userId') ?? '').trim();

    if (!userId) {
      throw new Error('User id is required');
    }

    if (currentUser.id === userId) {
      throw new Error('You cannot delete your own account');
    }

    await deleteUser(userId);

    revalidateUserPaths();

    return { success: true, message: 'User deleted' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete user' };
  }
}
