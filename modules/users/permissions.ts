import type { UserRole } from './constants';

export function canManageUsers(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canDeleteRecords(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canModifyBudgets(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canEditContent(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export function canUpdatePerformance(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export function canViewExecutiveOverview(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'VIEWER';
}

export function canAccessPage(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith('/users')) {
    return canManageUsers(role);
  }

  if (pathname.startsWith('/executive')) {
    return canViewExecutiveOverview(role);
  }

  return true;
}
