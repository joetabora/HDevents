import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canDeleteRecords, canEditContent, canManageUsers, canModifyBudgets, canUpdatePerformance } from './permissions';
import { AUTH_COOKIE_NAME, verifySessionToken } from './session';
import { getUserById, type SafeUser } from './services';

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.userId);
  return user;
}

export async function requireCurrentUserPage(): Promise<SafeUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireCurrentUserAction(): Promise<SafeUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireManageUsersPermission() {
  const user = await requireCurrentUserAction();
  if (!canManageUsers(user.role)) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

export async function requireDeletePermission() {
  const user = await requireCurrentUserAction();
  if (!canDeleteRecords(user.role)) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

export async function requireEditPermission() {
  const user = await requireCurrentUserAction();
  if (!canEditContent(user.role)) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

export async function requireBudgetPermission() {
  const user = await requireCurrentUserAction();
  if (!canModifyBudgets(user.role)) {
    throw new Error('Insufficient permissions');
  }
  return user;
}

export async function requirePerformancePermission() {
  const user = await requireCurrentUserAction();
  if (!canUpdatePerformance(user.role)) {
    throw new Error('Insufficient permissions');
  }
  return user;
}
