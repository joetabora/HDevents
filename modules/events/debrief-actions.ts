'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from '@/modules/users/activity';
import { requireEditPermission } from '@/modules/users/server';
import { generateAndSaveAIDebrief, updateEventDebriefContent } from './services/aiDebriefService';

function revalidateDebriefPaths(eventId: string) {
  revalidatePath(`/events/${eventId}`);
  revalidatePath('/events');
  revalidatePath('/executive');
}

export async function generateAIDebriefAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const eventId = String(formData.get('eventId') ?? '').trim();
    const mode = String(formData.get('mode') ?? 'GENERATE').trim() === 'REGENERATE' ? 'REGENERATE' : 'GENERATE';

    if (!eventId) {
      throw new Error('Event is required');
    }

    const created = await generateAndSaveAIDebrief({
      eventId,
      generatedById: user.id,
      mode
    });

    await logActivity({
      userId: user.id,
      action: mode === 'REGENERATE' ? 'AI_DEBRIEF_REGENERATED' : 'AI_DEBRIEF_GENERATED',
      entityType: 'EVENT_DEBRIEF',
      entityId: created.id
    });

    revalidateDebriefPaths(eventId);
    return { success: true, message: mode === 'REGENERATE' ? 'AI debrief regenerated' : 'AI debrief generated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to generate AI debrief' };
  }
}

export async function editAIDebriefAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const eventId = String(formData.get('eventId') ?? '').trim();
    const debriefId = String(formData.get('debriefId') ?? '').trim();
    const content = String(formData.get('content') ?? '').trim();

    if (!eventId || !debriefId) {
      throw new Error('Event and debrief are required');
    }

    const updated = await updateEventDebriefContent({
      debriefId,
      content
    });

    await logActivity({
      userId: user.id,
      action: 'AI_DEBRIEF_EDITED',
      entityType: 'EVENT_DEBRIEF',
      entityId: updated.id
    });

    revalidateDebriefPaths(eventId);
    return { success: true, message: 'Debrief updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update debrief' };
  }
}
