import { prisma } from '@/lib/db/prisma';
import { type SocialPlatform, type SocialPostStatus, type SocialPostType } from '@/lib/types/social';

export async function createSocialPost(params: {
  title: string;
  platforms: SocialPlatform[];
  type: SocialPostType;
  status: SocialPostStatus;
  scheduledFor?: Date | null;
  caption?: string;
  hashtags?: string;
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
