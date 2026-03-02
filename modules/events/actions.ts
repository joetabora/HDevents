'use server';

import { revalidatePath } from 'next/cache';
import { deleteDocument } from '@/modules/documents/services';
import { createEvent, createItemForEvent, deleteEvent } from './services';
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
  const name = String(formData.get('name') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const budget = String(formData.get('budget') ?? '').trim();

  if (!name || !date || !budget) {
    throw new Error('Missing required event fields');
  }

  await createEvent({
    name,
    date: parseDate(date),
    budget: parseBudget(budget)
  });

  revalidatePath('/');
  revalidatePath('/events');
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim();

  if (!id) {
    throw new Error('Missing event id');
  }

  await deleteEvent(id);
  revalidatePath('/');
  revalidatePath('/events');
}

export async function createItemAction(formData: FormData): Promise<void> {
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

  revalidatePath(eventPath || `/events/${eventId}`);
  revalidatePath('/contacts');
  revalidatePath('/');
  revalidatePath('/events');
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
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
