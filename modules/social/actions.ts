'use server';

import { revalidatePath } from 'next/cache';
import { createIdeaPost } from './services';
import { parseSocialPlatforms, parseSocialType } from './validators';

function parseOptionalDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Scheduled date is invalid');
  }

  return parsed;
}

export async function createIdeaPostAction(formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim();
  const type = parseSocialType(String(formData.get('type') ?? '').trim());
  const platforms = parseSocialPlatforms(formData.getAll('platforms').map((value) => String(value)));
  const scheduledFor = parseOptionalDate(String(formData.get('scheduledFor') ?? ''));

  if (!title) {
    throw new Error('Title is required');
  }

  await createIdeaPost({
    title,
    type,
    platforms,
    scheduledFor
  });

  revalidatePath('/social');
  revalidatePath('/social/pipeline');
  revalidatePath('/social/output');
  revalidatePath('/social/performance');
  revalidatePath('/social/ideas');
}
