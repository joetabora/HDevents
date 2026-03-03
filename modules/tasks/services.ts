import { prisma } from '@/lib/db/prisma';
import { parseTaskRelatedType, type TaskRelatedType } from './constants';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export async function createTask(params: {
  title: string;
  description?: string;
  relatedType: TaskRelatedType;
  relatedId?: string | null;
  assignedToId?: string | null;
  dueDate?: Date | null;
  createdById?: string | null;
}) {
  return prisma.task.create({
    data: {
      title: params.title,
      description: params.description?.trim() || null,
      relatedType: params.relatedType,
      relatedId: params.relatedId ?? null,
      assignedToId: params.assignedToId ?? null,
      dueDate: params.dueDate ?? null,
      createdById: params.createdById ?? null
    }
  });
}

export async function updateTaskCompletion(taskId: string, completed: boolean) {
  return prisma.task.update({
    where: { id: taskId },
    data: { completed }
  });
}

export async function listTasks() {
  const now = new Date();

  return prisma.task.findMany({
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }]
  }).then((tasks) => {
    return tasks.map((task) => ({
      ...task,
      isOverdue: !task.completed && Boolean(task.dueDate && task.dueDate < now),
      isDueToday:
        !task.completed &&
        Boolean(task.dueDate && task.dueDate >= startOfDay(now) && task.dueDate < endOfDay(now)),
      relatedType: parseTaskRelatedType(task.relatedType)
    }));
  });
}

export async function listTasksForUser(userId: string) {
  const tasks = await listTasks();
  return tasks.filter((task) => task.assignedToId === userId);
}

export async function getTaskSummary(now = new Date()) {
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [openTasks, overdueTasks, dueTodayTasks] = await Promise.all([
    prisma.task.count({ where: { completed: false } }),
    prisma.task.count({
      where: {
        completed: false,
        dueDate: { lt: now }
      }
    }),
    prisma.task.count({
      where: {
        completed: false,
        dueDate: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    })
  ]);

  return {
    openTasks,
    overdueTasks,
    dueTodayTasks
  };
}
