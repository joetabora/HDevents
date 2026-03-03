import { prisma } from '@/lib/db/prisma';
import { type SocialPlatform, type SocialPostStatus, type SocialPostType } from '@/lib/types/social';

export async function createSocialPost(params: {
  title: string;
  platforms: SocialPlatform[];
  type: SocialPostType;
  status: SocialPostStatus;
  scheduledFor?: Date | null;
}) {
  return prisma.socialPost.create({
    data: {
      title: params.title,
      platforms: params.platforms,
      type: params.type,
      status: params.status,
      scheduledFor: params.scheduledFor ?? null
    }
  });
}

export async function createIdeaPost(params: {
  title: string;
  platforms: SocialPlatform[];
  type: SocialPostType;
  scheduledFor?: Date | null;
}) {
  return createSocialPost({
    title: params.title,
    platforms: params.platforms,
    type: params.type,
    status: 'IDEA',
    scheduledFor: params.scheduledFor ?? null
  });
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
