import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { type EventPlaybook, type EventPlaybookExecutionItem } from '@/modules/events/playbook';
import { parseTaskRelatedType, type TaskRelatedType } from './constants';

const PLAYBOOK_TASK_MARKER = '[PLAYBOOK_TASK]';

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

function flattenPlaybookTaskItems(playbook: EventPlaybook): Array<{ section: string; item: EventPlaybookExecutionItem }> {
  return [
    ...playbook.checklist.map((item) => ({ section: 'Checklist', item })),
    ...playbook.weekFlow.monday.map((item) => ({ section: 'Monday', item })),
    ...playbook.weekFlow.tuesday.map((item) => ({ section: 'Tuesday', item })),
    ...playbook.weekFlow.wednesday.map((item) => ({ section: 'Wednesday', item })),
    ...playbook.weekFlow.friday.map((item) => ({ section: 'Friday', item })),
    ...playbook.weekFlow.saturday.map((item) => ({ section: 'Saturday', item })),
    ...playbook.postEventFollowUp.within24Hours.map((item) => ({ section: 'Follow-up 24 Hours', item })),
    ...playbook.postEventFollowUp.within3Days.map((item) => ({ section: 'Follow-up 3 Days', item })),
    ...playbook.postEventFollowUp.managerMeeting.map((item) => ({ section: 'Manager Meeting', item }))
  ];
}

function normalizeTaskTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parsePlaybookDueDate(value: string): Date | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(`${value}T09:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPlaybookTaskMarker(itemId: string): string {
  return `${PLAYBOOK_TASK_MARKER}:${itemId}`;
}

function buildPlaybookTaskDescription(params: { marker: string; section: string; notes: string }) {
  const lines = [`${params.marker}`, `Auto-generated from the event playbook.`, `Section: ${params.section}`];

  if (params.notes.trim()) {
    lines.push(`Notes: ${params.notes.trim()}`);
  }

  return lines.join('\n');
}

function isPlaybookTaskDescription(description: string | null): boolean {
  return Boolean(description?.includes(PLAYBOOK_TASK_MARKER));
}

export function isPlaybookAutoTask(description: string | null): boolean {
  return isPlaybookTaskDescription(description);
}

export async function syncPlaybookTasks(params: {
  eventId: string;
  playbook: EventPlaybook;
  createdById?: string | null;
}) {
  const sources = flattenPlaybookTaskItems(params.playbook)
    .map(({ section, item }) => {
      const dueDate = parsePlaybookDueDate(item.dueDate);
      const title = item.title.trim();

      if (!title || !item.ownerId || !dueDate) {
        return null;
      }

      return {
        marker: getPlaybookTaskMarker(item.id),
        title,
        dueDate,
        assignedToId: item.ownerId,
        description: buildPlaybookTaskDescription({
          marker: getPlaybookTaskMarker(item.id),
          section,
          notes: item.notes
        }),
        completed: item.completed
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const existingTasks = await prisma.task.findMany({
    where: {
      relatedType: 'EVENT',
      relatedId: params.eventId
    }
  });

  const existingAutoTasks = new Map(
    existingTasks
      .filter((task) => isPlaybookTaskDescription(task.description))
      .flatMap((task) => {
        const marker = task.description
          ?.split('\n')
          .map((line) => line.trim())
          .find((line) => line.startsWith(PLAYBOOK_TASK_MARKER));

        return marker ? [[marker, task] as const] : [];
      })
  );

  const existingManualTitles = new Set(
    existingTasks
      .filter((task) => !isPlaybookTaskDescription(task.description))
      .map((task) => normalizeTaskTitle(task.title))
  );

  const seenMarkers = new Set<string>();
  const operations: Prisma.PrismaPromise<unknown>[] = [];
  let created = 0;
  let updated = 0;
  let removed = 0;

  for (const source of sources) {
    seenMarkers.add(source.marker);
    const existingAutoTask = existingAutoTasks.get(source.marker);

    if (existingAutoTask) {
      operations.push(
        prisma.task.update({
          where: { id: existingAutoTask.id },
          data: {
            title: source.title,
            description: source.description,
            assignedToId: source.assignedToId,
            dueDate: source.dueDate,
            completed: source.completed
          }
        })
      );
      updated += 1;
      continue;
    }

    if (existingManualTitles.has(normalizeTaskTitle(source.title))) {
      continue;
    }

    operations.push(
      prisma.task.create({
        data: {
          title: source.title,
          description: source.description,
          relatedType: 'EVENT',
          relatedId: params.eventId,
          assignedToId: source.assignedToId,
          dueDate: source.dueDate,
          completed: source.completed,
          createdById: params.createdById ?? null
        }
      })
    );
    created += 1;
  }

  const staleTaskIds = [...existingAutoTasks.entries()]
    .filter(([marker]) => !seenMarkers.has(marker))
    .map(([, task]) => task.id);

  if (staleTaskIds.length > 0) {
    operations.push(
      prisma.task.deleteMany({
        where: {
          id: {
            in: staleTaskIds
          }
        }
      })
    );
    removed = staleTaskIds.length;
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  return {
    created,
    updated,
    removed
  };
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

export async function listTasksForEvent(eventId: string) {
  const now = new Date();

  return prisma.task.findMany({
    where: {
      relatedType: 'EVENT',
      relatedId: eventId
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }]
  }).then((tasks) =>
    tasks.map((task) => ({
      ...task,
      isOverdue: !task.completed && Boolean(task.dueDate && task.dueDate < now),
      isDueToday:
        !task.completed &&
        Boolean(task.dueDate && task.dueDate >= startOfDay(now) && task.dueDate < endOfDay(now)),
      isPlaybookAutoTask: isPlaybookTaskDescription(task.description)
    }))
  );
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
