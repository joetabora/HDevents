'use server';

import { revalidatePath } from 'next/cache';
import {
  createSocialPost,
  deleteSocialPost,
  updateSocialPost,
  updateSocialPostPerformance,
  updateSocialPostStatus
} from './services';
import { parseSocialPlatforms, parseSocialStatus, parseSocialType } from './validators';

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

function parseMetric(value: string): number {
  const normalized = value.trim() === '' ? '0' : value;
  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error('Metrics must be zero or positive numbers');
  }

  return Math.floor(parsed);
}

function revalidateSocialPaths() {
  revalidatePath('/social');
  revalidatePath('/social/pipeline');
  revalidatePath('/social/output');
  revalidatePath('/social/performance');
  revalidatePath('/social/ideas');
}

export async function createSocialPostAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const title = String(formData.get('title') ?? '').trim();
    const type = parseSocialType(String(formData.get('type') ?? '').trim());
    const status = parseSocialStatus(String(formData.get('status') ?? 'IDEA').trim());
    const platforms = parseSocialPlatforms(formData.getAll('platforms').map((value) => String(value)));
    const scheduledFor = parseOptionalDate(String(formData.get('scheduledFor') ?? ''));
    const caption = String(formData.get('caption') ?? '').trim();
    const hashtags = String(formData.get('hashtags') ?? '').trim();

    if (!title) {
      throw new Error('Title is required');
    }

    await createSocialPost({
      title,
      type,
      status,
      platforms,
      scheduledFor,
      caption,
      hashtags
    });

    revalidateSocialPaths();
    return { success: true, message: 'Post created' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create post' };
  }
}

export async function updateSocialPostAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const id = String(formData.get('id') ?? '').trim();
    const title = String(formData.get('title') ?? '').trim();
    const type = parseSocialType(String(formData.get('type') ?? '').trim());
    const status = parseSocialStatus(String(formData.get('status') ?? 'IDEA').trim());
    const platforms = parseSocialPlatforms(formData.getAll('platforms').map((value) => String(value)));
    const scheduledFor = parseOptionalDate(String(formData.get('scheduledFor') ?? ''));
    const caption = String(formData.get('caption') ?? '').trim();
    const hashtags = String(formData.get('hashtags') ?? '').trim();

    if (!id || !title) {
      throw new Error('Post id and title are required');
    }

    await updateSocialPost(id, {
      title,
      type,
      status,
      platforms,
      scheduledFor,
      caption,
      hashtags
    });

    revalidateSocialPaths();
    return { success: true, message: 'Post updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update post' };
  }
}

export async function deleteSocialPostAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const id = String(formData.get('id') ?? '').trim();

    if (!id) {
      throw new Error('Post id is required');
    }

    await deleteSocialPost(id);
    revalidateSocialPaths();
    return { success: true, message: 'Post deleted' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete post' };
  }
}

export async function updateSocialPostPerformanceAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const id = String(formData.get('id') ?? '').trim();

    if (!id) {
      throw new Error('Post id is required');
    }

    await updateSocialPostPerformance(id, {
      likes: parseMetric(String(formData.get('likes') ?? '0')),
      comments: parseMetric(String(formData.get('comments') ?? '0')),
      shares: parseMetric(String(formData.get('shares') ?? '0')),
      views: parseMetric(String(formData.get('views') ?? '0'))
    });

    revalidateSocialPaths();
    return { success: true, message: 'Performance updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update performance' };
  }
}

export async function updateSocialPostStatusAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const id = String(formData.get('id') ?? '').trim();
    const status = parseSocialStatus(String(formData.get('status') ?? '').trim());

    if (!id) {
      throw new Error('Post id is required');
    }

    await updateSocialPostStatus(id, status);
    revalidateSocialPaths();
    return { success: true, message: 'Status updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update status' };
  }
}
