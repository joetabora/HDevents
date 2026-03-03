import { prisma } from '@/lib/db/prisma';

export async function logActivity(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
}) {
  await prisma.activityLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null
    }
  });
}

export async function listRecentActivity(limit = 20) {
  return prisma.activityLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
}

export async function listUserActivity(userId: string, limit = 20) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit
  });
}
