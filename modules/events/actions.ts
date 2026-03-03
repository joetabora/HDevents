'use server';

import { revalidatePath } from 'next/cache';
import { deleteDocument } from '@/modules/documents/services';
import { logActivity } from '@/modules/users/activity';
import { requireBudgetPermission, requireDeletePermission, requireEditPermission } from '@/modules/users/server';
import { createEvent, createItemForEvent, deleteEvent, updateEventBudget } from './services';
import { parseCategory, parseItemStatus } from './validators';

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

export async function createEventAction(formData: FormData): Promise<void> {
  const user = await requireEditPermission();
  const name = String(formData.get('name') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const budget = String(formData.get('budget') ?? '').trim();

  if (!name || !date || !budget) {
    throw new Error('Missing required event fields');
  }

  await createEvent({
    name,
    date: parseDate(date),
    budget: parseBudget(budget),
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
  await requireDeletePermission();
  const documentId = String(formData.get('documentId') ?? '').trim();
  const eventPath = String(formData.get('eventPath') ?? '').trim();

  if (!documentId) {
    throw new Error('Missing document id');
  }

  await deleteDocument(documentId);
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

    await updateEventBudget(eventId, parseBudget(budgetValue));

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
