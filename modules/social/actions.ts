'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from '@/modules/users/activity';
import {
  requireDeletePermission,
  requireEditPermission,
  requirePerformancePermission
} from '@/modules/users/server';
import {
  createSocialPost,
  deleteSocialPost,
  fetchPublicMetricsFromUrl,
  updateSocialPost,
  updateSocialPostPerformance,
  updateSocialPostPublicMetrics,
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
  revalidatePath('/');
  revalidatePath('/executive');
}

export async function createSocialPostAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const title = String(formData.get('title') ?? '').trim();
    const type = parseSocialType(String(formData.get('type') ?? '').trim());
    const status = parseSocialStatus(String(formData.get('status') ?? 'IDEA').trim());
    const platforms = parseSocialPlatforms(formData.getAll('platforms').map((value) => String(value)));
    const scheduledFor = parseOptionalDate(String(formData.get('scheduledFor') ?? ''));
    const caption = String(formData.get('caption') ?? '').trim();
    const hashtags = String(formData.get('hashtags') ?? '').trim();
    const postUrl = String(formData.get('postUrl') ?? '').trim();

    if (!title) {
      throw new Error('Title is required');
    }

    const post = await createSocialPost({
      title,
      type,
      status,
      platforms,
      scheduledFor,
      caption,
      hashtags,
      postUrl,
      createdById: user.id
    });

    await logActivity({
      userId: user.id,
      action: 'POST_CREATED',
      entityType: 'SOCIAL_POST',
      entityId: post.id
    });

    revalidateSocialPaths();
    return { success: true, message: 'Post created' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create post' };
  }
}

export async function updateSocialPostAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const id = String(formData.get('id') ?? '').trim();
    const title = String(formData.get('title') ?? '').trim();
    const type = parseSocialType(String(formData.get('type') ?? '').trim());
    const status = parseSocialStatus(String(formData.get('status') ?? 'IDEA').trim());
    const platforms = parseSocialPlatforms(formData.getAll('platforms').map((value) => String(value)));
    const scheduledFor = parseOptionalDate(String(formData.get('scheduledFor') ?? ''));
    const caption = String(formData.get('caption') ?? '').trim();
    const hashtags = String(formData.get('hashtags') ?? '').trim();
    const postUrl = String(formData.get('postUrl') ?? '').trim();

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
      hashtags,
      postUrl
    });

    await logActivity({
      userId: user.id,
      action: 'POST_UPDATED',
      entityType: 'SOCIAL_POST',
      entityId: id
    });

    revalidateSocialPaths();
    return { success: true, message: 'Post updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update post' };
  }
}

export async function deleteSocialPostAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    await requireDeletePermission();
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
    const user = await requirePerformancePermission();
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

    await logActivity({
      userId: user.id,
      action: 'PERFORMANCE_UPDATED',
      entityType: 'SOCIAL_POST',
      entityId: id
    });

    revalidateSocialPaths();
    return { success: true, message: 'Performance updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update performance' };
  }
}

export async function updateSocialPostStatusAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requireEditPermission();
    const id = String(formData.get('id') ?? '').trim();
    const status = parseSocialStatus(String(formData.get('status') ?? '').trim());

    if (!id) {
      throw new Error('Post id is required');
    }

    await updateSocialPostStatus(id, status);

    await logActivity({
      userId: user.id,
      action: `POST_STATUS_${status}`,
      entityType: 'SOCIAL_POST',
      entityId: id
    });

    revalidateSocialPaths();
    return { success: true, message: 'Status updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update status' };
  }
}

export async function fetchSocialPublicMetricsAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const user = await requirePerformancePermission();
    const id = String(formData.get('id') ?? '').trim();
    const postUrl = String(formData.get('postUrl') ?? '').trim();

    if (!id || !postUrl) {
      throw new Error('Post id and URL are required');
    }

    const metrics = await fetchPublicMetricsFromUrl(postUrl);

    await updateSocialPostPublicMetrics(id, {
      publicLikes: metrics.likes,
      publicComments: metrics.comments,
      publicShares: metrics.shares,
      publicViews: metrics.views,
      postUrl
    });

    await logActivity({
      userId: user.id,
      action: 'PUBLIC_METRICS_SYNCED',
      entityType: 'SOCIAL_POST',
      entityId: id
    });

    revalidateSocialPaths();

    return { success: true, message: 'Public metrics updated' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to fetch automatically. Enter manually.' };
  }
}
