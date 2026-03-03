'use server';

import { revalidatePath } from 'next/cache';
import { parseCategory } from '@/modules/events/validators';
import { logActivity } from '@/modules/users/activity';
import { requireDeletePermission, requireEditPermission } from '@/modules/users/server';
import { deleteContact, updateContact } from './services';

export async function updateContactAction(formData: FormData): Promise<void> {
  const user = await requireEditPermission();
  const id = String(formData.get('id') ?? '');
  const businessName = String(formData.get('businessName') ?? '').trim();
  const category = parseCategory(String(formData.get('category') ?? ''));

  if (!id || !businessName) {
    throw new Error('Missing required contact fields');
  }

  await updateContact({
    id,
    businessName,
    category,
    contactName: String(formData.get('contactName') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    notes: String(formData.get('notes') ?? '').trim()
  });

  await logActivity({
    userId: user.id,
    action: 'CONTACT_UPDATED',
    entityType: 'VENDOR',
    entityId: id
  });

  revalidatePath('/contacts');
  revalidatePath('/events');
}

export async function deleteContactAction(formData: FormData): Promise<void> {
  await requireDeletePermission();
  const id = String(formData.get('id') ?? '');

  if (!id) {
    throw new Error('Missing contact id');
  }

  await deleteContact(id);

  revalidatePath('/contacts');
  revalidatePath('/events');
}
