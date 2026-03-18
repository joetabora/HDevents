'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { logActivity } from '@/modules/users/activity';
import { requireCurrentUserAction, requireEditPermission } from '@/modules/users/server';
import { parseTaskRelatedType } from './constants';
import { createTask, updateTaskCompletion } from './services';

function parseOptionalDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid due date');
  }

  return parsed;
}

function revalidateTaskPaths() {
  revalidatePath('/tasks');
  revalidatePath('/tasks/mine');
  revalidatePath('/');
  revalidatePath('/executive');
}

function revalidateRelatedTaskPath(relatedType: string, relatedId: string | null) {
  if (relatedType === 'EVENT' && relatedId) {
    revalidatePath(`/events/${relatedId}`);
    revalidatePath('/events');
  }
}

async function getTaskRelation(taskId: string): Promise<{ relatedType: string; relatedId: string | null }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      relatedType: true,
      relatedId: true
    }
  });

  if (!task) {
    throw new Error('Task not found');
  }

  return {
    relatedType: task.relatedType,
    relatedId: task.relatedId
  };
}

export async function createTaskAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();

    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const relatedType = parseTaskRelatedType(String(formData.get('relatedType') ?? 'GENERAL').trim());
    const relatedId = String(formData.get('relatedId') ?? '').trim() || null;
    const assignedToId = String(formData.get('assignedToId') ?? '').trim() || null;
    const dueDate = parseOptionalDate(String(formData.get('dueDate') ?? '').trim());

    if (!title) {
      throw new Error('Task title is required');
    }

    const task = await createTask({
      title,
      description,
      relatedType,
      relatedId,
      assignedToId,
      dueDate,
      createdById: user.id
    });

    await logActivity({
      userId: user.id,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id
    });

    revalidateTaskPaths();
    revalidateRelatedTaskPath(relatedType, relatedId);
    return { success: true, message: 'Task created' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create task' };
  }
}

export async function toggleTaskCompleteAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireCurrentUserAction();

    const taskId = String(formData.get('taskId') ?? '').trim();
    const completed = String(formData.get('completed') ?? '').trim() === 'true';

    if (!taskId) {
      throw new Error('Task id is required');
    }

    await updateTaskCompletion(taskId, completed);

    await logActivity({
      userId: user.id,
      action: completed ? 'TASK_COMPLETED' : 'TASK_REOPENED',
      entityType: 'TASK',
      entityId: taskId
    });

    revalidateTaskPaths();
    const task = await getTaskRelation(taskId);
    revalidateRelatedTaskPath(task.relatedType, task.relatedId);

    return { success: true, message: completed ? 'Task completed' : 'Task reopened' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update task' };
  }
}
