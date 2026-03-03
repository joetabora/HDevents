import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from './passwords';
import {
  PRIMARY_ORG_ID,
  parseUserDepartment,
  parseUserRole,
  type UserDepartment,
  type UserRole
} from './constants';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: UserDepartment;
  orgId: string;
  createdAt: Date;
};

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  orgId: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: parseUserRole(user.role),
    department: parseUserDepartment(user.department),
    orgId: user.orgId,
    createdAt: user.createdAt
  };
}

export async function getUserCount(): Promise<number> {
  return prisma.user.count();
}

export async function listUsers(): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      orgId: true,
      createdAt: true
    }
  });

  return users.map(toSafeUser);
}

export async function listUserOptions() {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true
    }
  });

  return users.map((user) => ({
    ...user,
    role: parseUserRole(user.role),
    department: parseUserDepartment(user.department)
  }));
}

export async function getUserById(userId: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      orgId: true,
      createdAt: true
    }
  });

  return user ? toSafeUser(user) : null;
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
}

export async function verifyUserCredentials(email: string, password: string): Promise<SafeUser | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return toSafeUser(user);
}

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: UserDepartment;
}): Promise<SafeUser> {
  const created = await prisma.user.create({
    data: {
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      password: hashPassword(params.password),
      role: params.role,
      department: params.department,
      orgId: PRIMARY_ORG_ID
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      orgId: true,
      createdAt: true
    }
  });

  return toSafeUser(created);
}

export async function updateUserRoleAndDepartment(params: {
  userId: string;
  role: UserRole;
  department: UserDepartment;
}) {
  const updated = await prisma.user.update({
    where: { id: params.userId },
    data: {
      role: params.role,
      department: params.department
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      orgId: true,
      createdAt: true
    }
  });

  return toSafeUser(updated);
}

export async function updateUserPassword(params: { userId: string; password: string }) {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      password: hashPassword(params.password)
    }
  });
}

export async function deleteUser(userId: string) {
  return prisma.user.delete({ where: { id: userId } });
}

export async function ensureBootstrapAdmin(params: {
  name: string;
  email: string;
  password: string;
}): Promise<SafeUser> {
  const userCount = await getUserCount();

  if (userCount > 0) {
    const existing = await getUserByEmail(params.email);
    if (!existing) {
      throw new Error('Admin bootstrap user not found');
    }

    return toSafeUser(existing);
  }

  return createUser({
    name: params.name,
    email: params.email,
    password: params.password,
    role: 'ADMIN',
    department: 'ADMIN'
  });
}
