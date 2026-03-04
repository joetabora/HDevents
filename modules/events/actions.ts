'use server';

import { revalidatePath } from 'next/cache';
import { deleteDocument } from '@/modules/documents/services';
import { logActivity } from '@/modules/users/activity';
import { requireBudgetPermission, requireDeletePermission, requireEditPermission } from '@/modules/users/server';
import {
  assertEventEditableByRole,
  createEvent,
  createItemForEvent,
  deleteEvent,
  finalizeEvent,
  getDocumentEventMutationContext,
  regenerateEventArchive,
  reopenEvent,
  updateEventBudget
} from './services';
import { parseCategory, parseItemStatus, parseOptionalEventType } from './validators';

function parseBudget(input: string): number {
  const value = Number(input);
  if (Number.isNaN(value) || value < 0) {
    throw new Error('Budget must be a valid positive number');
  }
  return value;
}

function parseDate(input: string): Date {
  const parsedDate = new Date(input);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Date is invalid');
  }
  return parsedDate;
}

function parseFee(input: string): number {
  const value = Number(input);
  if (Number.isNaN(value) || value < 0) {
    throw new Error('Fee must be a valid positive number');
  }
  return value;
}

function parseOptionalNumber(input: FormDataEntryValue | null): number | null {
  const raw = String(input ?? '').trim();
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (Number.isNaN(value) || value < 0) {
    throw new Error('Numeric values must be a valid positive number');
  }

  return value;
}

export async function createEventAction(formData: FormData): Promise<void> {
  const user = await requireEditPermission();
  const name = String(formData.get('name') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const budget = String(formData.get('budget') ?? '').trim();
  const eventType = parseOptionalEventType(String(formData.get('eventType') ?? '').trim());

  if (!name || !date || !budget) {
    throw new Error('Missing required event fields');
  }

  await createEvent({
    name,
    date: parseDate(date),
    budget: parseBudget(budget),
    eventType,
    createdById: user.id,
    assignedToId: String(formData.get('assignedToId') ?? '').trim() || null
  });

  await logActivity({
    userId: user.id,
    action: 'EVENT_CREATED',
    entityType: 'EVENT'
  });

  revalidatePath('/');
  revalidatePath('/events');
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  await requireDeletePermission();
  const id = String(formData.get('id') ?? '').trim();

  if (!id) {
    throw new Error('Missing event id');
  }

  await deleteEvent(id);
  revalidatePath('/');
  revalidatePath('/events');
}

export async function createItemAction(formData: FormData): Promise<void> {
  const user = await requireEditPermission();
  const eventId = String(formData.get('eventId') ?? '').trim();
  const eventPath = String(formData.get('eventPath') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const feeInput = String(formData.get('fee') ?? '').trim();
  const category = parseCategory(String(formData.get('category') ?? '').trim());
  const status = parseItemStatus(String(formData.get('status') ?? 'PROSPECT').trim());

  if (!eventId || !name || !feeInput) {
    throw new Error('Missing required item fields');
  }

  const files = formData.getAll('documents').filter((entry): entry is File => entry instanceof File);
  const context = await assertEventEditableByRole({
    eventId,
    role: user.role
  });

  await createItemForEvent({
    eventId,
    name,
    fee: parseFee(feeInput),
    category,
    status,
    notes: String(formData.get('notes') ?? '').trim(),
    contactId: String(formData.get('contactId') ?? '').trim(),
    newContact: {
      businessName: String(formData.get('newContactBusinessName') ?? '').trim(),
      contactName: String(formData.get('newContactName') ?? '').trim(),
      phone: String(formData.get('newContactPhone') ?? '').trim(),
      email: String(formData.get('newContactEmail') ?? '').trim(),
      notes: String(formData.get('newContactNotes') ?? '').trim()
    },
    files
  });

  if (context.status === 'COMPLETED' && user.role === 'ADMIN') {
    await logActivity({
      userId: user.id,
      action: 'EVENT_EDITED_AFTER_COMPLETION',
      entityType: 'EVENT',
      entityId: eventId
    });
  }

  await logActivity({
    userId: user.id,
    action: 'ITEM_CREATED',
    entityType: 'VENDOR'
  });

  revalidatePath(eventPath || `/events/${eventId}`);
  revalidatePath('/contacts');
  revalidatePath('/');
  revalidatePath('/events');
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const user = await requireDeletePermission();
  const documentId = String(formData.get('documentId') ?? '').trim();
  const eventPath = String(formData.get('eventPath') ?? '').trim();

  if (!documentId) {
    throw new Error('Missing document id');
  }

  const context = await getDocumentEventMutationContext(documentId);

  await deleteDocument(documentId);

  if (context.status === 'COMPLETED') {
    await logActivity({
      userId: user.id,
      action: 'EVENT_EDITED_AFTER_COMPLETION',
      entityType: 'EVENT',
      entityId: context.eventId
    });
  }

  if (eventPath) {
    revalidatePath(eventPath);
  }
}

export async function updateEventBudgetAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireBudgetPermission();
    const eventId = String(formData.get('eventId') ?? '').trim();
    const budgetValue = String(formData.get('budget') ?? '').trim();

    if (!eventId || !budgetValue) {
      throw new Error('Event and budget are required');
    }

    const context = await assertEventEditableByRole({
      eventId,
      role: user.role
    });

    await updateEventBudget(eventId, parseBudget(budgetValue));

    if (context.status === 'COMPLETED' && user.role === 'ADMIN') {
      await logActivity({
        userId: user.id,
        action: 'EVENT_EDITED_AFTER_COMPLETION',
        entityType: 'EVENT',
        entityId: eventId
      });
    }

    await logActivity({
      userId: user.id,
      action: 'BUDGET_UPDATED',
      entityType: 'EVENT',
      entityId: eventId
    });

    revalidatePath('/');
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);

    return { success: true, message: 'Budget updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update budget' };
  }
}

export async function updateEventBudgetFormAction(formData: FormData): Promise<void> {
  const result = await updateEventBudgetAction(formData);
  if (!result.success) {
    throw new Error(result.message);
  }
}

export async function finalizeEventAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const eventId = String(formData.get('eventId') ?? '').trim();

    if (!eventId) {
      throw new Error('Event is required');
    }

    await finalizeEvent({
      eventId,
      finalizedById: user.id,
      finalizedByName: user.name,
      finalAttendance: parseOptionalNumber(formData.get('finalAttendance')),
      finalBudgetUsed: parseOptionalNumber(formData.get('finalBudgetUsed')),
      finalNotes: String(formData.get('finalNotes') ?? '').trim() || null
    });

    await logActivity({
      userId: user.id,
      action: 'EVENT_COMPLETED',
      entityType: 'EVENT',
      entityId: eventId
    });

    await logActivity({
      userId: user.id,
      action: 'ARCHIVE_GENERATED',
      entityType: 'EVENT',
      entityId: eventId
    });

    revalidatePath('/');
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);

    return { success: true, message: 'Event finalized and archive version created' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to finalize event' };
  }
}

export async function reopenEventAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    if (user.role !== 'ADMIN') {
      throw new Error('Only admins can reopen completed events');
    }

    const eventId = String(formData.get('eventId') ?? '').trim();
    if (!eventId) {
      throw new Error('Event is required');
    }

    await reopenEvent(eventId);

    await logActivity({
      userId: user.id,
      action: 'EVENT_REOPENED',
      entityType: 'EVENT',
      entityId: eventId
    });

    revalidatePath('/');
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);

    return { success: true, message: 'Event reopened' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to reopen event' };
  }
}

export async function regenerateEventArchiveAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    if (user.role !== 'ADMIN') {
      throw new Error('Only admins can regenerate archives');
    }

    const eventId = String(formData.get('eventId') ?? '').trim();
    if (!eventId) {
      throw new Error('Event is required');
    }

    await regenerateEventArchive({
      eventId,
      generatedById: user.id,
      generatedByName: user.name
    });

    await logActivity({
      userId: user.id,
      action: 'ARCHIVE_REGENERATED',
      entityType: 'EVENT',
      entityId: eventId
    });

    revalidatePath('/');
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);

    return { success: true, message: 'Archive regenerated with a new version' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to regenerate archive' };
  }
}
