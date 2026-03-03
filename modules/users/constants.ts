export const USER_ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const;
export const USER_DEPARTMENTS = ['MARKETING', 'EVENTS', 'SALES', 'SERVICE', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserDepartment = (typeof USER_DEPARTMENTS)[number];

export const PRIMARY_ORG_ID = 'RALLY_MAIN';

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function isUserDepartment(value: string): value is UserDepartment {
  return USER_DEPARTMENTS.includes(value as UserDepartment);
}

export function parseUserRole(value: string): UserRole {
  if (!isUserRole(value)) {
    throw new Error('Invalid user role');
  }

  return value;
}

export function parseUserDepartment(value: string): UserDepartment {
  if (!isUserDepartment(value)) {
    throw new Error('Invalid user department');
  }

  return value;
}
