import { prisma } from '@/lib/db/prisma';
import { type SocialPlatform, type SocialPostStatus, type SocialPostType } from '@/lib/types/social';

function parseMetricValue(value: string): number {
  const normalized = value.replace(/,/g, '').trim();
  const suffix = normalized.slice(-1).toUpperCase();

  if (['K', 'M', 'B'].includes(suffix)) {
    const base = Number(normalized.slice(0, -1));
    if (Number.isNaN(base)) {
      return 0;
    }

    const multiplier = suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : 1_000_000_000;
    return Math.round(base * multiplier);
  }

  const integer = Number(normalized);
  return Number.isNaN(integer) ? 0 : Math.round(integer);
}

function extractMetric(html: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    const value = parseMetricValue(match[1]);
    if (value >= 0) {
      return value;
    }
  }

  return 0;
}

function assertPublicUrl(url: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error('URL is invalid');
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('Only public HTTP/HTTPS URLs are supported');
  }

  const host = parsed.hostname.toLowerCase();
  const allowedHosts = ['facebook.com', 'www.facebook.com', 'instagram.com', 'www.instagram.com', 'youtube.com', 'www.youtube.com', 'youtu.be'];

  if (!allowedHosts.includes(host)) {
    throw new Error('Only public Facebook, Instagram, and YouTube URLs are supported');
  }

  return parsed;
}

export async function fetchPublicMetricsFromUrl(postUrl: string): Promise<{
  likes: number;
  comments: number;
  shares: number;
  views: number;
}> {
  const parsed = assertPublicUrl(postUrl.trim());

  const response = await fetch(parsed.toString(), {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Unable to fetch public post URL');
  }

  const html = await response.text();

  const likes = extractMetric(html, [
    /"like_count"\s*:\s*"?([\d.,KMBkmb]+)"?/i,
    /"likes"\s*:\s*"?([\d.,KMBkmb]+)"?/i,
    /"edge_media_preview_like"\s*:\s*\{[^}]*"count"\s*:\s*([\d.,KMBkmb]+)/i
  ]);
  const comments = extractMetric(html, [
    /"comment_count"\s*:\s*"?([\d.,KMBkmb]+)"?/i,
    /"comments"\s*:\s*"?([\d.,KMBkmb]+)"?/i,
    /"edge_media_to_comment"\s*:\s*\{[^}]*"count"\s*:\s*([\d.,KMBkmb]+)/i
  ]);
  const shares = extractMetric(html, [
    /"share_count"\s*:\s*"?([\d.,KMBkmb]+)"?/i,
    /"shares"\s*:\s*"?([\d.,KMBkmb]+)"?/i
  ]);
  const views = extractMetric(html, [
    /"view_count"\s*:\s*"?([\d.,KMBkmb]+)"?/i,
    /"viewCount"\s*:\s*"([\d.,KMBkmb]+)"/i,
    /"video_view_count"\s*:\s*"?([\d.,KMBkmb]+)"?/i
  ]);

  if (likes === 0 && comments === 0 && shares === 0 && views === 0) {
    throw new Error('Unable to fetch automatically. Enter manually.');
  }

  return { likes, comments, shares, views };
}

export async function createSocialPost(params: {
  title: string;
  platforms: SocialPlatform[];
  type: SocialPostType;
  status: SocialPostStatus;
  scheduledFor?: Date | null;
  caption?: string;
  hashtags?: string;
  postUrl?: string;
  createdById?: string | null;
}) {
  const postedAt = params.status === 'POSTED' ? new Date() : null;

  return prisma.socialPost.create({
    data: {
      title: params.title,
      platforms: params.platforms,
      type: params.type,
      status: params.status,
      scheduledFor: params.scheduledFor ?? null,
      caption: params.caption?.trim() || null,
      hashtags: params.hashtags?.trim() || null,
      postUrl: params.postUrl?.trim() || null,
      createdById: params.createdById ?? null,
      postedAt
    }
  });
}

export async function updateSocialPost(
  postId: string,
  params: {
    title: string;
    platforms: SocialPlatform[];
    type: SocialPostType;
    status: SocialPostStatus;
    scheduledFor?: Date | null;
    caption?: string;
    hashtags?: string;
    postUrl?: string;
  }
) {
  const postedAt = params.status === 'POSTED' ? new Date() : null;

  return prisma.socialPost.update({
    where: { id: postId },
    data: {
      title: params.title,
      platforms: params.platforms,
      type: params.type,
      status: params.status,
      scheduledFor: params.scheduledFor ?? null,
      caption: params.caption?.trim() || null,
      hashtags: params.hashtags?.trim() || null,
      postUrl: params.postUrl?.trim() || null,
      postedAt
    }
  });
}

export async function deleteSocialPost(postId: string) {
  return prisma.socialPost.delete({ where: { id: postId } });
}

export async function updateSocialPostStatus(postId: string, status: SocialPostStatus) {
  const postedAt = status === 'POSTED' ? new Date() : null;

  return prisma.socialPost.update({
    where: { id: postId },
    data: {
      status,
      postedAt
    }
  });
}

export async function updateSocialPostPerformance(
  postId: string,
  metrics: { likes: number; comments: number; shares: number; views: number }
) {
  return prisma.socialPost.update({
    where: { id: postId },
    data: {
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      views: metrics.views
    }
  });
}

export async function updateSocialPostPublicMetrics(
  postId: string,
  metrics: { publicLikes: number; publicComments: number; publicShares: number; publicViews: number; postUrl?: string }
) {
  return prisma.socialPost.update({
    where: { id: postId },
    data: {
      publicLikes: metrics.publicLikes,
      publicComments: metrics.publicComments,
      publicShares: metrics.publicShares,
      publicViews: metrics.publicViews,
      postUrl: metrics.postUrl?.trim() || undefined,
      lastSyncedAt: new Date()
    }
  });
}

export async function listSocialPostsForScheduleWindow(params: { from: Date; to: Date }) {
  return prisma.socialPost.findMany({
    where: {
      scheduledFor: {
        gte: params.from,
        lte: params.to
      }
    },
    orderBy: {
      scheduledFor: 'asc'
    }
  });
}
