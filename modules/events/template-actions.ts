'use server';

import { revalidatePath } from 'next/cache';
import { type Category, type EventType } from '@/lib/types/domain';
import { logActivity } from '@/modules/users/activity';
import { requireEditPermission } from '@/modules/users/server';
import {
  archiveEventTemplate,
  createEventFromTemplate,
  duplicateEventTemplate,
  saveEventAsTemplate,
  updateEventTemplate
} from './templates';
import { parseOptionalEventType } from './validators';

function parseDate(input: string): Date {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Date is invalid');
  }
  return parsed;
}

function parseBudget(input: string): number {
  const value = Number(input);
  if (Number.isNaN(value) || value < 0) {
    throw new Error('Budget must be a valid positive number');
  }
  return value;
}

function parseChecklistLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseBudgetCategoryLines(value: string): Array<{ category: Category; estimate: number }> {
  const categories: Array<{ category: Category; estimate: number }> = [];
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const [categoryPart, estimatePart] = line.split(':').map((segment) => segment.trim());
    const category = (categoryPart ?? '').toUpperCase();
    const estimate = Number(estimatePart ?? 0);

    if (!['FOOD', 'ENTERTAINMENT', 'MERCH', 'PERMIT', 'MISC'].includes(category)) {
      continue;
    }

    if (!Number.isFinite(estimate) || estimate < 0) {
      continue;
    }

    categories.push({
      category: category as Category,
      estimate
    });
  }

  return categories;
}

function revalidateTemplatePaths(eventId?: string) {
  revalidatePath('/events');
  revalidatePath('/events/templates');
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
  }
}

export async function saveEventAsTemplateAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const eventId = String(formData.get('eventId') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();

    if (!eventId || !name) {
      throw new Error('Event and template name are required');
    }

    const template = await saveEventAsTemplate({
      eventId,
      name,
      description,
      createdById: user.id
    });

    await logActivity({
      userId: user.id,
      action: 'EVENT_TEMPLATE_CREATED',
      entityType: 'EVENT_TEMPLATE',
      entityId: template.id
    });

    revalidateTemplatePaths(eventId);
    return { success: true, message: 'Template saved from event' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to save template' };
  }
}

export async function createEventFromTemplateAction(formData: FormData): Promise<{ success: boolean; message: string; eventId?: string }> {
  try {
    const user = await requireEditPermission();
    const templateId = String(formData.get('templateId') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();
    const dateInput = String(formData.get('date') ?? '').trim();
    const budgetInput = String(formData.get('budget') ?? '').trim();
    const eventType = parseOptionalEventType(String(formData.get('eventType') ?? '').trim());
    const assignedToId = String(formData.get('assignedToId') ?? '').trim() || null;
    const selectedBackupVendorIds = formData
      .getAll('backupVendorIds')
      .map((value) => String(value).trim())
      .filter(Boolean);

    if (!templateId || !name || !dateInput || !budgetInput) {
      throw new Error('Missing required fields for event creation');
    }

    const created = await createEventFromTemplate({
      templateId,
      name,
      date: parseDate(dateInput),
      budget: parseBudget(budgetInput),
      eventType,
      assignedToId,
      createdById: user.id,
      selectedBackupVendorIds
    });

    await logActivity({
      userId: user.id,
      action: 'EVENT_CREATED_FROM_TEMPLATE',
      entityType: 'EVENT',
      entityId: created.event.id
    });

    revalidateTemplatePaths(created.event.id);
    revalidatePath('/tasks');
    revalidatePath('/tasks/mine');
    return { success: true, message: 'Event created from template', eventId: created.event.id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create event from template' };
  }
}

export async function updateEventTemplateAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const templateId = String(formData.get('templateId') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const eventType = parseOptionalEventType(String(formData.get('eventType') ?? '').trim()) as EventType | null;
    const budgetCategories = parseBudgetCategoryLines(String(formData.get('budgetCategoriesText') ?? ''));
    const taskChecklist = parseChecklistLines(String(formData.get('taskChecklistText') ?? ''));
    const timelineMilestones = parseChecklistLines(String(formData.get('timelineMilestonesText') ?? ''));

    if (!templateId || !name) {
      throw new Error('Template id and name are required');
    }

    await updateEventTemplate({
      templateId,
      name,
      description,
      eventType,
      budgetCategories,
      taskChecklist,
      timelineMilestones
    });

    await logActivity({
      userId: user.id,
      action: 'EVENT_TEMPLATE_UPDATED',
      entityType: 'EVENT_TEMPLATE',
      entityId: templateId
    });

    revalidateTemplatePaths();
    return { success: true, message: 'Template updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update template' };
  }
}

export async function duplicateEventTemplateAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const templateId = String(formData.get('templateId') ?? '').trim();
    if (!templateId) {
      throw new Error('Template is required');
    }

    const duplicate = await duplicateEventTemplate({
      templateId,
      userId: user.id
    });

    await logActivity({
      userId: user.id,
      action: 'EVENT_TEMPLATE_DUPLICATED',
      entityType: 'EVENT_TEMPLATE',
      entityId: duplicate.id
    });

    revalidateTemplatePaths();
    return { success: true, message: 'Template duplicated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to duplicate template' };
  }
}

export async function archiveEventTemplateAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const templateId = String(formData.get('templateId') ?? '').trim();
    if (!templateId) {
      throw new Error('Template is required');
    }

    await archiveEventTemplate(templateId);

    await logActivity({
      userId: user.id,
      action: 'EVENT_TEMPLATE_ARCHIVED',
      entityType: 'EVENT_TEMPLATE',
      entityId: templateId
    });

    revalidateTemplatePaths();
    return { success: true, message: 'Template archived' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to archive template' };
  }
}
