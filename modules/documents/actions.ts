'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from '@/modules/users/activity';
import { requireEditPermission } from '@/modules/users/server';
import { createGlobalDocument } from './services';

export async function uploadGlobalDocumentAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();

    const name = String(formData.get('name') ?? '').trim();
    const relatedType = String(formData.get('relatedType') ?? 'GENERAL').trim().toUpperCase();
    const relatedId = String(formData.get('relatedId') ?? '').trim() || null;
    const file = formData.get('file');

    if (!name) {
      throw new Error('Document name is required');
    }

    if (!(file instanceof File)) {
      throw new Error('Document file is required');
    }

    const document = await createGlobalDocument({
      name,
      relatedType,
      relatedId,
      file,
      uploadedById: user.id
    });

    await logActivity({
      userId: user.id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'GLOBAL_DOCUMENT',
      entityId: document.id
    });

    revalidatePath('/documents');
    revalidatePath('/executive');

    return { success: true, message: 'Document uploaded' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to upload document' };
  }
}
