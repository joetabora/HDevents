import { prisma } from '@/lib/db/prisma';
import { SOCIAL_PLATFORMS, SOCIAL_POST_STATUSES, type SocialPlatform } from '@/lib/types/social';

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function engagementScore(metrics: { likes: number; comments: number; shares: number; views: number }): number {
  return Math.round(metrics.likes * 1 + metrics.comments * 3 + metrics.shares * 5 + metrics.views / 10);
}

export async function getSocialDashboardSummary(now = new Date()) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const nextWeek = new Date(now.getTime() + SEVEN_DAYS_IN_MS);

  const [usedBikesPostedToday, totalPostsToday, upcomingScheduledPosts, overduePosts] = await Promise.all([
    prisma.socialPost.count({
      where: {
        type: 'USED_BIKE',
        status: 'POSTED',
        scheduledFor: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    }),
    prisma.socialPost.count({
      where: {
        status: 'POSTED',
        OR: [
          {
            postedAt: {
              gte: todayStart,
              lt: todayEnd
            }
          },
          {
            postedAt: null,
            scheduledFor: {
              gte: todayStart,
              lt: todayEnd
            }
          }
        ]
      }
    }),
    prisma.socialPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          gte: now,
          lte: nextWeek
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      },
      take: 50
    }),
    prisma.socialPost.count({
      where: {
        status: {
          not: 'POSTED'
        },
        scheduledFor: {
          lt: now
        }
      }
    })
  ]);

  const momentumScore = clamp(
    Math.round(totalPostsToday * 14 + usedBikesPostedToday * 18 + upcomingScheduledPosts.length * 2 - overduePosts * 9),
    0,
    100
  );

  return {
    usedBikesPostedToday,
    usedBikeGoal: 4,
    totalPostsToday,
    momentumScore,
    upcomingScheduledPosts,
    overduePosts
  };
}

export async function getPipelinePostsGrouped() {
  const posts = await prisma.socialPost.findMany({
    orderBy: [
      { scheduledFor: 'asc' },
      { updatedAt: 'desc' }
    ]
  });

  return {
    IDEA: posts.filter((post) => post.status === 'IDEA'),
    FILMING: posts.filter((post) => post.status === 'FILMING'),
    EDITING: posts.filter((post) => post.status === 'EDITING'),
    SCHEDULED: posts.filter((post) => post.status === 'SCHEDULED'),
    POSTED: posts.filter((post) => post.status === 'POSTED')
  } as Record<(typeof SOCIAL_POST_STATUSES)[number], typeof posts>;
}

export async function getDailyOutputSummary(now = new Date()) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const usedBikePostedToday = await prisma.socialPost.count({
    where: {
      type: 'USED_BIKE',
      status: 'POSTED',
      scheduledFor: {
        gte: todayStart,
        lt: todayEnd
      }
    }
  });

  return {
    goal: 4,
    completed: usedBikePostedToday,
    progressPercent: clamp(Math.round((usedBikePostedToday / 4) * 100), 0, 100)
  };
}

export async function getUsedBikePostsPostedToday(now = new Date()) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  return prisma.socialPost.findMany({
    where: {
      type: 'USED_BIKE',
      status: 'POSTED',
      scheduledFor: {
        gte: todayStart,
        lt: todayEnd
      }
    },
    orderBy: {
      scheduledFor: 'asc'
    }
  });
}

export async function getPerformanceSummary() {
  const [postedPosts, topPosts] = await Promise.all([
    prisma.socialPost.findMany({
      where: {
        status: 'POSTED'
      },
      select: {
        id: true,
        title: true,
        platforms: true,
        likes: true,
        comments: true,
        shares: true,
        views: true,
        publicLikes: true,
        publicComments: true,
        publicShares: true,
        publicViews: true
      }
    }),
    prisma.socialPost.findMany({
      where: {
        status: 'POSTED'
      },
      take: 200
    })
  ]);

  const platformTotals = SOCIAL_PLATFORMS.reduce((acc, platform) => {
    acc[platform] = {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      posts: 0
    };
    return acc;
  }, {} as Record<SocialPlatform, { likes: number; comments: number; shares: number; views: number; posts: number }>);

  for (const post of postedPosts) {
    for (const platform of post.platforms) {
      if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) {
        continue;
      }

      const key = platform as SocialPlatform;
      const resolvedLikes = post.publicLikes > 0 ? post.publicLikes : post.likes;
      const resolvedComments = post.publicComments > 0 ? post.publicComments : post.comments;
      const resolvedShares = post.publicShares > 0 ? post.publicShares : post.shares;
      const resolvedViews = post.publicViews > 0 ? post.publicViews : post.views;

      platformTotals[key].likes += resolvedLikes;
      platformTotals[key].comments += resolvedComments;
      platformTotals[key].shares += resolvedShares;
      platformTotals[key].views += resolvedViews;
      platformTotals[key].posts += 1;
    }
  }

  const leaderboard = topPosts
    .map((post) => {
      const hasPublicMetrics = post.publicLikes > 0 || post.publicComments > 0 || post.publicShares > 0 || post.publicViews > 0;
      const likes = hasPublicMetrics ? post.publicLikes : post.likes;
      const comments = hasPublicMetrics ? post.publicComments : post.comments;
      const shares = hasPublicMetrics ? post.publicShares : post.shares;
      const views = hasPublicMetrics ? post.publicViews : post.views;

      return {
        ...post,
        score: engagementScore({ likes, comments, shares, views }),
        displayLikes: likes,
        displayComments: comments,
        displayShares: shares,
        displayViews: views
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    platformTotals,
    topPosts: leaderboard.slice(0, 5),
    leaderboard
  };
}

export async function getIdeaVaultPosts() {
  return prisma.socialPost.findMany({
    where: {
      status: 'IDEA'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
