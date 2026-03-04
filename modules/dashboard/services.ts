import { prisma } from '@/lib/db/prisma';
import { getTaskSummary } from '@/modules/tasks/services';
import { listUserActivity } from '@/modules/users/activity';
import type { UserRole } from '@/modules/users/constants';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return startOfDay(monday);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function scoreFromPublicMetrics(metrics: {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}): number {
  return Math.round(metrics.likes * 1 + metrics.comments * 3 + metrics.shares * 5 + metrics.views / 10);
}

export async function getPersonalOverview(user: { id: string; role: UserRole }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  const [assignedTasks, socialByUser, eventsAssigned, activity, recentFollowups, budgetEvents] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        completed: false
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 12
    }),
    prisma.socialPost.findMany({
      where: {
        createdById: user.id
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    }),
    prisma.event.findMany({
      where: {
        OR: [{ assignedToId: user.id }, { createdById: user.id }]
      },
      orderBy: { date: 'asc' },
      take: 8,
      include: {
        items: {
          select: { fee: true }
        }
      }
    }),
    listUserActivity(user.id, 14),
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        completed: false,
        dueDate: {
          gte: todayStart
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 8
    }),
    prisma.event.findMany({
      where: {
        createdAt: {
          gte: weekStart
        }
      },
      include: {
        items: { select: { fee: true } }
      }
    })
  ]);

  const budgetAlerts =
    user.role === 'VIEWER'
      ? []
      : budgetEvents
          .map((event) => {
            const spent = event.items.reduce((sum, item) => sum + item.fee, 0);
            return {
              id: event.id,
              name: event.name,
              budget: event.budget,
              spent,
              remaining: event.budget - spent
            };
          })
          .filter((event) => event.remaining < 0)
          .slice(0, 6);

  return {
    assignedTasks,
    upcomingFollowUps: recentFollowups,
    socialPostsCreatedByYou: socialByUser,
    eventsAssignedToYou: eventsAssigned,
    budgetAlerts,
    activity
  };
}

export async function getExecutiveOverview() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);

  const [
    postsThisWeek,
    usedBikesToday,
    postedInRange,
    topPostsRaw,
    activeEvents,
    upcomingEvents,
    allEvents,
    lockedVendors,
    taskSummary,
    docsWeek,
    globalDocsWeek,
    activeLeads,
    leadsThisMonth,
    followUpsDueToday,
    overdueFollowUps,
    newContactsThisWeek
  ] = await Promise.all([
    prisma.socialPost.count({
      where: { createdAt: { gte: weekStart } }
    }),
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
    prisma.socialPost.findMany({
      where: {
        OR: [
          {
            postedAt: {
              gte: thirtyDaysAgo,
              lte: now
            }
          },
          {
            postedAt: null,
            status: 'POSTED',
            scheduledFor: {
              gte: thirtyDaysAgo,
              lte: now
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        postedAt: true,
        scheduledFor: true,
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
      select: {
        id: true,
        title: true,
        platforms: true,
        publicLikes: true,
        publicComments: true,
        publicShares: true,
        publicViews: true,
        likes: true,
        comments: true,
        shares: true,
        views: true
      },
      take: 100
    }),
    prisma.event.count({
      where: {
        status: {
          in: ['PLANNING', 'ACTIVE']
        }
      }
    }),
    prisma.event.count({
      where: {
        date: { gte: now }
      }
    }),
    prisma.event.findMany({
      include: {
        items: {
          select: {
            fee: true,
            status: true
          }
        }
      }
    }),
    prisma.item.count({
      where: {
        status: 'LOCKED_IN'
      }
    }),
    getTaskSummary(now),
    prisma.document.count({
      where: {
        uploadedAt: { gte: weekStart }
      }
    }),
    prisma.globalDocument.count({
      where: {
        uploadedAt: { gte: weekStart }
      }
    }),
    prisma.contact.count({
      where: {
        contactType: 'LEAD',
        status: {
          in: ['CONTACTED', 'ACTIVE']
        }
      }
    }),
    prisma.contact.count({
      where: {
        contactType: 'LEAD',
        createdAt: {
          gte: monthStart
        }
      }
    }),
    prisma.task.count({
      where: {
        relatedType: 'CONTACT',
        completed: false,
        dueDate: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    }),
    prisma.task.count({
      where: {
        relatedType: 'CONTACT',
        completed: false,
        dueDate: {
          lt: todayStart
        }
      }
    }),
    prisma.contact.count({
      where: {
        createdAt: {
          gte: weekStart
        }
      }
    })
  ]);

  const budget = allEvents.reduce(
    (acc, event) => {
      const spent = event.items.reduce((sum, item) => sum + item.fee, 0);
      acc.totalBudget += event.budget;
      acc.totalSpent += spent;
      return acc;
    },
    { totalBudget: 0, totalSpent: 0 }
  );

  const trendMap = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(thirtyDaysAgo);
    day.setDate(thirtyDaysAgo.getDate() + i);
    const key = startOfDay(day).toISOString().slice(0, 10);
    trendMap.set(key, 0);
  }

  for (const post of postedInRange) {
    const stamp = post.postedAt ?? post.scheduledFor;
    if (!stamp) {
      continue;
    }

    const key = startOfDay(stamp).toISOString().slice(0, 10);
    const current = trendMap.get(key) ?? 0;
    const score = scoreFromPublicMetrics({
      likes: post.publicLikes,
      comments: post.publicComments,
      shares: post.publicShares,
      views: post.publicViews
    });
    trendMap.set(key, current + score);
  }

  const engagementTrend = Array.from(trendMap.entries()).map(([date, score]) => ({ date, score }));

  const leaderboard = topPostsRaw
    .map((post) => {
      const publicScore = scoreFromPublicMetrics({
        likes: post.publicLikes,
        comments: post.publicComments,
        shares: post.publicShares,
        views: post.publicViews
      });

      const fallbackScore = scoreFromPublicMetrics({
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views
      });

      return {
        id: post.id,
        title: post.title,
        platforms: post.platforms,
        score: publicScore > 0 ? publicScore : fallbackScore,
        publicLikes: post.publicLikes,
        publicComments: post.publicComments,
        publicShares: post.publicShares,
        publicViews: post.publicViews
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    marketing: {
      postsThisWeek,
      usedBikesToday,
      engagementTrend,
      topPerformingPost: leaderboard[0] ?? null,
      leaderboard
    },
    events: {
      activeEvents,
      upcomingEvents,
      budget,
      lockedVendors
    },
    operations: {
      openTasks: taskSummary.openTasks,
      overdueTasks: taskSummary.overdueTasks,
      documentsUploadedThisWeek: docsWeek + globalDocsWeek
    },
    crm: {
      totalActiveLeads: activeLeads,
      leadsThisMonth,
      followUpsDueToday,
      overdueFollowUps,
      newContactsThisWeek
    }
  };
}

export async function getWeeklySummaryData() {
  const executive = await getExecutiveOverview();

  const engagementTotals = executive.marketing.leaderboard.reduce(
    (acc, post) => {
      acc.likes += post.publicLikes;
      acc.comments += post.publicComments;
      acc.shares += post.publicShares;
      acc.views += post.publicViews;
      return acc;
    },
    { likes: 0, comments: 0, shares: 0, views: 0 }
  );

  return {
    usedBikesPosted: executive.marketing.usedBikesToday,
    engagementTotals,
    topPost: executive.marketing.topPerformingPost,
    activeEvents: executive.events.activeEvents,
    budget: executive.events.budget,
    operations: executive.operations
  };
}
