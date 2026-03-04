import { prisma } from '@/lib/db/prisma';
import { formatCurrency } from '@/lib/utils/format';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(index: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index] ?? 'N/A';
}

function scoreFromMetrics(metrics: { likes: number; comments: number; shares: number; views: number }): number {
  return Math.round(metrics.likes + metrics.comments * 3 + metrics.shares * 5 + metrics.views / 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizePercent(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

function toRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1)
  };
}

export async function listIntelligenceYears() {
  const rows = await prisma.event.findMany({
    where: {
      status: 'COMPLETED'
    },
    select: {
      date: true
    },
    orderBy: {
      date: 'desc'
    }
  });

  const years = Array.from(new Set(rows.map((row) => row.date.getFullYear())));
  if (years.length === 0) {
    years.push(new Date().getFullYear());
  }

  return years.sort((a, b) => b - a);
}

export async function getAnnualIntelligence(year: number) {
  const { start, end } = toRange(year);
  const socialWindowStart = new Date(year - 1, 11, 1);
  const socialWindowEnd = new Date(year + 1, 0, 31);

  const events = await prisma.event.findMany({
    where: {
      status: 'COMPLETED',
      date: {
        gte: start,
        lt: end
      }
    },
    include: {
      items: {
        include: {
          contact: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  const eventIds = events.map((event) => event.id);
  const itemIds = events.flatMap((event) => event.items.map((item) => item.id));

  const [tasks, posts] = await Promise.all([
    eventIds.length === 0 && itemIds.length === 0
      ? Promise.resolve([])
      : prisma.task.findMany({
          where: {
            OR: [
              {
                relatedType: 'EVENT',
                relatedId: {
                  in: eventIds.length > 0 ? eventIds : ['__none__']
                }
              },
              {
                relatedType: 'VENDOR',
                relatedId: {
                  in: itemIds.length > 0 ? itemIds : ['__none__']
                }
              }
            ]
          }
        }),
    prisma.socialPost.findMany({
      where: {
        status: 'POSTED',
        OR: [
          {
            postedAt: {
              gte: socialWindowStart,
              lte: socialWindowEnd
            }
          },
          {
            scheduledFor: {
              gte: socialWindowStart,
              lte: socialWindowEnd
            }
          }
        ]
      }
    })
  ]);

  const resolvedPosts = posts.map((post) => {
    const likes = post.publicLikes > 0 ? post.publicLikes : post.likes;
    const comments = post.publicComments > 0 ? post.publicComments : post.comments;
    const shares = post.publicShares > 0 ? post.publicShares : post.shares;
    const views = post.publicViews > 0 ? post.publicViews : post.views;
    const score = scoreFromMetrics({ likes, comments, shares, views });
    const when = post.postedAt ?? post.scheduledFor ?? post.createdAt;
    return {
      ...post,
      likes,
      comments,
      shares,
      views,
      score,
      when
    };
  });

  const postsThisYear = resolvedPosts.filter((post) => post.when >= start && post.when < end);
  const totalEngagementScore = postsThisYear.reduce((sum, post) => sum + post.score, 0);

  const taskByEvent = new Map<string, { total: number; completed: number }>();
  const vendorTasksByItem = new Map<string, { total: number; completed: number }>();
  for (const task of tasks) {
    if (!task.relatedId) {
      continue;
    }

    if (task.relatedType === 'EVENT') {
      const prev = taskByEvent.get(task.relatedId) ?? { total: 0, completed: 0 };
      prev.total += 1;
      if (task.completed) {
        prev.completed += 1;
      }
      taskByEvent.set(task.relatedId, prev);
    }

    if (task.relatedType === 'VENDOR') {
      const prev = vendorTasksByItem.get(task.relatedId) ?? { total: 0, completed: 0 };
      prev.total += 1;
      if (task.completed) {
        prev.completed += 1;
      }
      vendorTasksByItem.set(task.relatedId, prev);
    }
  }

  const eventPerformanceRows = events.map((event) => {
    const actualSpend = event.finalBudgetUsed ?? event.items.reduce((sum, item) => sum + item.fee, 0);
    const attendance = event.finalAttendance ?? 0;
    const budgetVariance = event.budget - actualSpend;
    const eventTasks = taskByEvent.get(event.id) ?? { total: 0, completed: 0 };
    const taskCompletionRate = eventTasks.total === 0 ? 100 : (eventTasks.completed / eventTasks.total) * 100;

    const eventPosts = resolvedPosts.filter((post) => {
      const eventWindowStart = new Date(event.date);
      eventWindowStart.setDate(eventWindowStart.getDate() - 10);
      const eventWindowEnd = new Date(event.date);
      eventWindowEnd.setDate(eventWindowEnd.getDate() + 10);
      return post.when >= eventWindowStart && post.when <= eventWindowEnd;
    });
    const engagement = eventPosts.reduce((sum, post) => sum + post.score, 0);

    return {
      id: event.id,
      name: event.name,
      date: event.date,
      estimatedBudget: event.budget,
      actualSpend,
      budgetVariance,
      attendance,
      taskCompletionRate,
      engagement
    };
  });

  const maxEngagement = Math.max(1, ...eventPerformanceRows.map((row) => row.engagement));

  let previousAttendance = 0;
  const rankedEvents = eventPerformanceRows.map((row, index) => {
    const budgetScore = clamp(1 - Math.abs(row.estimatedBudget - row.actualSpend) / Math.max(row.estimatedBudget, 1), 0, 1);
    const taskScore = clamp(row.taskCompletionRate / 100, 0, 1);
    const engagementScore = clamp(row.engagement / maxEngagement, 0, 1);
    const efficiencyScore = Math.round((budgetScore * 0.4 + taskScore * 0.3 + engagementScore * 0.3) * 100);
    const roiScore = Number(((row.engagement + row.attendance * 8) / Math.max(row.actualSpend, 1)).toFixed(4));
    const attendanceGrowth = index === 0 ? 0 : row.attendance - previousAttendance;
    previousAttendance = row.attendance;

    return {
      ...row,
      efficiencyScore,
      roiScore,
      attendanceGrowth
    };
  });

  const topPerformingEvent = rankedEvents.slice().sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0] ?? null;
  const lowestPerformingEvent = rankedEvents.slice().sort((a, b) => a.efficiencyScore - b.efficiencyScore)[0] ?? null;

  const vendorStats = new Map<
    string,
    {
      vendorName: string;
      vendorId: string;
      usageCount: number;
      totalCost: number;
      withinBudgetCount: number;
      vendorTaskTotal: number;
      vendorTaskCompleted: number;
      eventIds: Set<string>;
    }
  >();

  const itemToVendor = new Map<string, string>();
  for (const event of events) {
    const isWithinBudget = (event.finalBudgetUsed ?? event.items.reduce((sum, item) => sum + item.fee, 0)) <= event.budget;

    for (const item of event.items) {
      if (!item.contactId) {
        continue;
      }

      itemToVendor.set(item.id, item.contactId);
      const vendorName = item.contact?.businessName ?? item.name;
      const prev = vendorStats.get(item.contactId) ?? {
        vendorName,
        vendorId: item.contactId,
        usageCount: 0,
        totalCost: 0,
        withinBudgetCount: 0,
        vendorTaskTotal: 0,
        vendorTaskCompleted: 0,
        eventIds: new Set<string>()
      };

      prev.usageCount += 1;
      prev.totalCost += item.fee;
      if (isWithinBudget) {
        prev.withinBudgetCount += 1;
      }
      prev.eventIds.add(event.id);
      vendorStats.set(item.contactId, prev);
    }
  }

  for (const [itemId, taskSummary] of vendorTasksByItem.entries()) {
    const vendorId = itemToVendor.get(itemId);
    if (!vendorId) {
      continue;
    }

    const vendor = vendorStats.get(vendorId);
    if (!vendor) {
      continue;
    }

    vendor.vendorTaskTotal += taskSummary.total;
    vendor.vendorTaskCompleted += taskSummary.completed;
  }

  const vendorRows = Array.from(vendorStats.values()).map((vendor) => {
    const distinctEvents = vendor.eventIds.size;
    const reusedPercent = events.length === 0 ? 0 : (distinctEvents / events.length) * 100;
    const withinBudgetPercent = vendor.usageCount === 0 ? 0 : (vendor.withinBudgetCount / vendor.usageCount) * 100;
    const taskCompletionPercent =
      vendor.vendorTaskTotal === 0 ? 100 : (vendor.vendorTaskCompleted / vendor.vendorTaskTotal) * 100;

    const reliabilityScore = Math.round(reusedPercent * 0.4 + withinBudgetPercent * 0.35 + taskCompletionPercent * 0.25);

    return {
      ...vendor,
      distinctEvents,
      reusedPercent: normalizePercent(reusedPercent),
      withinBudgetPercent: normalizePercent(withinBudgetPercent),
      taskCompletionPercent: normalizePercent(taskCompletionPercent),
      reliabilityScore
    };
  });

  const mostUsedVendor = vendorRows.slice().sort((a, b) => b.usageCount - a.usageCount)[0] ?? null;
  const highestCostVendor = vendorRows.slice().sort((a, b) => b.totalCost - a.totalCost)[0] ?? null;
  const vendorConsistencyScore =
    vendorRows.length === 0 ? 0 : Math.round(vendorRows.reduce((sum, vendor) => sum + vendor.reliabilityScore, 0) / vendorRows.length);

  const monthlyBudget = Array.from({ length: 12 }, (_, index) => ({
    month: monthLabel(index),
    estimated: 0,
    actual: 0
  }));
  const monthlyAttendance = Array.from({ length: 12 }, (_, index) => ({
    month: monthLabel(index),
    attendance: 0
  }));
  const monthlyEngagement = Array.from({ length: 12 }, (_, index) => ({
    month: monthLabel(index),
    engagement: 0
  }));

  for (const row of rankedEvents) {
    const monthIndex = row.date.getMonth();
    monthlyBudget[monthIndex].estimated += row.estimatedBudget;
    monthlyBudget[monthIndex].actual += row.actualSpend;
    monthlyAttendance[monthIndex].attendance += row.attendance;
  }

  for (const post of postsThisYear) {
    const monthIndex = post.when.getMonth();
    monthlyEngagement[monthIndex].engagement += post.score;
  }

  const annualSummary = {
    totalEvents: events.length,
    totalEstimatedBudget: rankedEvents.reduce((sum, row) => sum + row.estimatedBudget, 0),
    totalActualSpend: rankedEvents.reduce((sum, row) => sum + row.actualSpend, 0),
    totalAttendance: rankedEvents.reduce((sum, row) => sum + row.attendance, 0),
    averageAttendancePerEvent:
      events.length === 0 ? 0 : Math.round(rankedEvents.reduce((sum, row) => sum + row.attendance, 0) / events.length),
    totalMarketingPosts: postsThisYear.length,
    totalEngagementScore,
    topPerformingEvent,
    lowestPerformingEvent,
    mostUsedVendor,
    highestCostVendor,
    vendorConsistencyScore
  };

  const ranking = {
    byROI: rankedEvents.slice().sort((a, b) => b.roiScore - a.roiScore).slice(0, 5),
    byEngagement: rankedEvents.slice().sort((a, b) => b.engagement - a.engagement).slice(0, 5),
    byAttendanceGrowth: rankedEvents.slice().sort((a, b) => b.attendanceGrowth - a.attendanceGrowth).slice(0, 5)
  };

  const summaryParagraph =
    annualSummary.totalEvents === 0
      ? `No completed events were captured in ${year}. Build templates and close out events to populate intelligence metrics.`
      : `${year} closed with ${annualSummary.totalEvents} completed events, ${formatCurrency(annualSummary.totalEstimatedBudget)} estimated budget, ${formatCurrency(annualSummary.totalActualSpend)} actual spend, and ${annualSummary.totalEngagementScore} engagement score. ${annualSummary.topPerformingEvent ? `${annualSummary.topPerformingEvent.name} led efficiency at ${annualSummary.topPerformingEvent.efficiencyScore}.` : ''}`;

  return {
    year,
    summary: annualSummary,
    charts: {
      budgetVsActual: monthlyBudget.map((row) => ({
        ...row,
        estimated: Number(row.estimated.toFixed(2)),
        actual: Number(row.actual.toFixed(2))
      })),
      attendanceTrend: monthlyAttendance,
      engagementTrend: monthlyEngagement,
      vendorUsageFrequency: vendorRows
        .slice()
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
        .map((vendor) => ({
          vendor: vendor.vendorName,
          usageCount: vendor.usageCount
        }))
    },
    vendorRows: vendorRows
      .slice()
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, 20),
    events: rankedEvents,
    ranking,
    summaryParagraph
  };
}
