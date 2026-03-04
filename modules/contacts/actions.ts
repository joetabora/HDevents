'use server';

import { revalidatePath } from 'next/cache';
import { parseContactSource, parseContactStatus, parseContactType, parseInteractionType } from '@/lib/types/crm';
import { parseCategory } from '@/modules/events/validators';
import { logActivity } from '@/modules/users/activity';
import { requireDeletePermission, requireEditPermission } from '@/modules/users/server';
import {
  attachContactToEvent,
  attachContactToSocialPost,
  convertEventContactToLead,
  createInteraction,
  createLeadFromSocialPost,
  deleteContact,
  updateContact
} from './services';

function parseOptionalDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid follow-up date');
  }

  return parsed;
}

function revalidateContactPaths(contactId?: string) {
  revalidatePath('/contacts');
  revalidatePath('/events');
  revalidatePath('/social');
  revalidatePath('/social/pipeline');
  revalidatePath('/social/ideas');
  revalidatePath('/social/performance');
  revalidatePath('/tasks');
  revalidatePath('/tasks/mine');
  revalidatePath('/executive');
  if (contactId) {
    revalidatePath(`/contacts/${contactId}`);
  }
}

export async function updateContactAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const id = String(formData.get('id') ?? '').trim();

    if (!id) {
      throw new Error('Missing contact id');
    }

    const previousStatus = String(formData.get('previousStatus') ?? '').trim() || null;
    const status = parseContactStatus(String(formData.get('status') ?? 'NEW'));

    await updateContact({
      id,
      firstName: String(formData.get('firstName') ?? '').trim(),
      lastName: String(formData.get('lastName') ?? '').trim(),
      businessName: String(formData.get('businessName') ?? '').trim(),
      company: String(formData.get('company') ?? '').trim(),
      category: parseCategory(String(formData.get('category') ?? 'MISC').trim()),
      contactName: String(formData.get('contactName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      contactType: parseContactType(String(formData.get('contactType') ?? 'VENDOR').trim()),
      source: parseContactSource(String(formData.get('source') ?? 'OTHER').trim()),
      status,
      assignedToId: String(formData.get('assignedToId') ?? '').trim() || null
    });

    await logActivity({
      userId: user.id,
      action: 'CONTACT_UPDATED',
      entityType: 'CONTACT',
      entityId: id
    });

    if (previousStatus && previousStatus !== status) {
      await logActivity({
        userId: user.id,
        action: 'CONTACT_STATUS_CHANGED',
        entityType: 'CONTACT',
        entityId: id
      });
    }

    revalidateContactPaths(id);
    return { success: true, message: 'Contact updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update contact' };
  }
}

export async function deleteContactAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    await requireDeletePermission();
    const id = String(formData.get('id') ?? '').trim();

    if (!id) {
      throw new Error('Missing contact id');
    }

    await deleteContact(id);
    revalidateContactPaths();
    return { success: true, message: 'Contact deleted' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete contact' };
  }
}

export async function addInteractionAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const contactId = String(formData.get('contactId') ?? '').trim();
    const type = parseInteractionType(String(formData.get('type') ?? 'NOTE'));
    const summary = String(formData.get('summary') ?? '').trim();
    const followUpDate = parseOptionalDate(String(formData.get('followUpDate') ?? '').trim());

    if (!contactId || !summary) {
      throw new Error('Interaction summary is required');
    }

    const result = await createInteraction({
      contactId,
      type,
      summary,
      followUpDate,
      createdById: user.id
    });

    await logActivity({
      userId: user.id,
      action: 'INTERACTION_ADDED',
      entityType: 'CONTACT',
      entityId: contactId
    });

    if (result.followupTaskId) {
      await logActivity({
        userId: user.id,
        action: 'FOLLOWUP_TASK_CREATED',
        entityType: 'TASK',
        entityId: result.followupTaskId
      });
    }

    revalidateContactPaths(contactId);
    return { success: true, message: result.followupTaskId ? 'Interaction added and follow-up task created' : 'Interaction added' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to add interaction' };
  }
}

export async function attachContactToEventAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const contactId = String(formData.get('contactId') ?? '').trim();
    const eventId = String(formData.get('eventId') ?? '').trim();
    const roleTag = String(formData.get('roleTag') ?? '').trim();

    if (!contactId || !eventId) {
      throw new Error('Contact and event are required');
    }

    await attachContactToEvent({
      contactId,
      eventId,
      roleTag
    });

    await logActivity({
      userId: user.id,
      action: 'CONTACT_UPDATED',
      entityType: 'CONTACT',
      entityId: contactId
    });

    revalidateContactPaths(contactId);
    return { success: true, message: 'Contact attached to event' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to attach contact to event' };
  }
}

export async function convertEventContactToLeadAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const contactId = String(formData.get('contactId') ?? '').trim();
    const eventId = String(formData.get('eventId') ?? '').trim();

    if (!contactId || !eventId) {
      throw new Error('Contact and event are required');
    }

    await convertEventContactToLead({
      contactId,
      eventId,
      assignedToId: String(formData.get('assignedToId') ?? '').trim() || null
    });

    await logActivity({
      userId: user.id,
      action: 'CONTACT_STATUS_CHANGED',
      entityType: 'CONTACT',
      entityId: contactId
    });

    revalidateContactPaths(contactId);
    return { success: true, message: 'Contact converted to lead' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to convert contact' };
  }
}

export async function attachContactToSocialAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const contactId = String(formData.get('contactId') ?? '').trim();
    const socialPostId = String(formData.get('socialPostId') ?? '').trim();
    const relationshipType = String(formData.get('relationshipType') ?? '').trim();

    if (!contactId || !socialPostId) {
      throw new Error('Contact and social post are required');
    }

    await attachContactToSocialPost({
      contactId,
      socialPostId,
      relationshipType
    });

    await logActivity({
      userId: user.id,
      action: 'CONTACT_UPDATED',
      entityType: 'CONTACT',
      entityId: contactId
    });

    revalidateContactPaths(contactId);
    return { success: true, message: 'Social campaign linked to contact' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to attach social campaign' };
  }
}

export async function createLeadFromSocialAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const socialPostId = String(formData.get('socialPostId') ?? '').trim();
    const firstName = String(formData.get('firstName') ?? '').trim();

    if (!socialPostId || !firstName) {
      throw new Error('First name and social post are required');
    }

    const lead = await createLeadFromSocialPost({
      socialPostId,
      firstName,
      lastName: String(formData.get('lastName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      assignedToId: String(formData.get('assignedToId') ?? '').trim() || user.id
    });

    await logActivity({
      userId: user.id,
      action: 'CONTACT_CREATED',
      entityType: 'CONTACT',
      entityId: lead.id
    });

    revalidateContactPaths();
    return { success: true, message: 'Lead created from social engagement' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create lead' };
  }
}

export async function updateContactFormAction(formData: FormData): Promise<void> {
  const result = await updateContactAction(formData);
  if (!result.success) {
    throw new Error(result.message);
  }
}

export async function deleteContactFormAction(formData: FormData): Promise<void> {
  const result = await deleteContactAction(formData);
  if (!result.success) {
    throw new Error(result.message);
  }
}

export async function attachContactToEventFormAction(formData: FormData): Promise<void> {
  const result = await attachContactToEventAction(formData);
  if (!result.success) {
    throw new Error(result.message);
  }
}

export async function convertEventContactToLeadFormAction(formData: FormData): Promise<void> {
  const result = await convertEventContactToLeadAction(formData);
  if (!result.success) {
    throw new Error(result.message);
  }
}

export async function attachContactToSocialFormAction(formData: FormData): Promise<void> {
  const result = await attachContactToSocialAction(formData);
  if (!result.success) {
    throw new Error(result.message);
  }
}
