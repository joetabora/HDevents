import { prisma } from '@/lib/db/prisma';
import { formatCurrency } from '@/lib/utils/format';

function engagementScore(metrics: { likes: number; comments: number; shares: number; views: number }): number {
  return Math.round(metrics.likes + metrics.comments * 3 + metrics.shares * 5 + metrics.views / 10);
}

function percentage(value: number): string {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${Math.round(value)}%`;
}

function chooseStrengths(params: {
  attendance: number;
  attendanceGoalProxy: number;
  budgetVariance: number;
  taskCompletionRate: number;
  engagementTotal: number;
}): string[] {
  const strengths: string[] = [];

  if (params.attendance >= params.attendanceGoalProxy) {
    strengths.push(`Attendance met or exceeded expectations (${params.attendance} attendees).`);
  }

  if (params.budgetVariance >= 0) {
    strengths.push(`Budget remained controlled with ${formatCurrency(params.budgetVariance)} remaining.`);
  }

  if (params.taskCompletionRate >= 75) {
    strengths.push(`Execution discipline was strong (${percentage(params.taskCompletionRate)} tasks completed).`);
  }

  if (params.engagementTotal > 0) {
    strengths.push(`Marketing generated measurable response (${params.engagementTotal} total engagement score).`);
  }

  if (strengths.length === 0) {
    strengths.push('Team delivered core event operations with available resources and clear ownership.');
  }

  return strengths;
}

function chooseBottlenecks(params: {
  budgetVariance: number;
  taskCompletionRate: number;
  lockedVendorRate: number;
  overdueTaskCount: number;
}): string[] {
  const issues: string[] = [];

  if (params.budgetVariance < 0) {
    issues.push(`Budget overrun of ${formatCurrency(Math.abs(params.budgetVariance))} indicates planning variance.`);
  }

  if (params.taskCompletionRate < 65) {
    issues.push(`Task completion rate (${percentage(params.taskCompletionRate)}) suggests follow-through risk.`);
  }

  if (params.lockedVendorRate < 60) {
    issues.push(`Vendor lock-in ratio (${percentage(params.lockedVendorRate)}) was lower than ideal before execution.`);
  }

  if (params.overdueTaskCount > 0) {
    issues.push(`${params.overdueTaskCount} overdue tasks were still open near completion.`);
  }

  if (issues.length === 0) {
    issues.push('No major operational bottlenecks were detected from captured event data.');
  }

  return issues;
}

export async function buildEventDebriefContext(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      items: {
        include: {
          contact: true
        }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const eventTasksPromise = prisma.task.findMany({
    where: {
      relatedType: 'EVENT',
      relatedId: event.id
    }
  });

  const vendorTaskPromise = prisma.task.findMany({
    where: {
      relatedType: 'VENDOR',
      relatedId: {
        in: event.items.map((item) => item.id)
      }
    }
  });

  const socialWindowStart = new Date(event.date);
  socialWindowStart.setDate(socialWindowStart.getDate() - 14);
  const socialWindowEnd = new Date(event.date);
  socialWindowEnd.setDate(socialWindowEnd.getDate() + 14);

  const socialPostsPromise = prisma.socialPost.findMany({
    where: {
      OR: [
        {
          scheduledFor: {
            gte: socialWindowStart,
            lte: socialWindowEnd
          }
        },
        {
          postedAt: {
            gte: socialWindowStart,
            lte: socialWindowEnd
          }
        }
      ]
    }
  });

  const [eventTasks, vendorTasks, socialPosts] = await Promise.all([eventTasksPromise, vendorTaskPromise, socialPostsPromise]);

  const resolvedSocial = socialPosts.map((post) => {
    const likes = post.publicLikes > 0 ? post.publicLikes : post.likes;
    const comments = post.publicComments > 0 ? post.publicComments : post.comments;
    const shares = post.publicShares > 0 ? post.publicShares : post.shares;
    const views = post.publicViews > 0 ? post.publicViews : post.views;
    const score = engagementScore({ likes, comments, shares, views });

    return {
      ...post,
      likes,
      comments,
      shares,
      views,
      score
    };
  });

  const topPost = resolvedSocial.sort((a, b) => b.score - a.score)[0] ?? null;

  const totalEstimated = event.budget;
  const totalActual = event.finalBudgetUsed ?? event.items.reduce((sum, item) => sum + item.fee, 0);
  const budgetVariance = totalEstimated - totalActual;

  const totalTasks = eventTasks.length + vendorTasks.length;
  const completedTasks = [...eventTasks, ...vendorTasks].filter((task) => task.completed).length;
  const taskCompletionRate = totalTasks === 0 ? 100 : (completedTasks / totalTasks) * 100;
  const overdueTaskCount = [...eventTasks, ...vendorTasks].filter((task) => !task.completed && task.dueDate && task.dueDate < new Date()).length;

  const lockedVendors = event.items.filter((item) => item.status === 'LOCKED_IN').length;
  const lockedVendorRate = event.items.length === 0 ? 100 : (lockedVendors / event.items.length) * 100;

  const marketingTotals = resolvedSocial.reduce(
    (acc, post) => {
      acc.likes += post.likes;
      acc.comments += post.comments;
      acc.shares += post.shares;
      acc.views += post.views;
      acc.score += post.score;
      return acc;
    },
    { likes: 0, comments: 0, shares: 0, views: 0, score: 0 }
  );

  return {
    event,
    totals: {
      estimatedBudget: totalEstimated,
      actualBudget: totalActual,
      budgetVariance,
      attendance: event.finalAttendance ?? 0,
      taskCompletionRate,
      totalTasks,
      completedTasks,
      overdueTaskCount,
      lockedVendorRate
    },
    vendors: event.items.map((item) => ({
      name: item.name,
      category: item.category,
      cost: item.fee,
      status: item.status,
      businessName: item.contact?.businessName ?? null
    })),
    marketing: {
      posts: resolvedSocial,
      totals: marketingTotals,
      topPost: topPost
        ? {
            title: topPost.title,
            score: topPost.score
          }
        : null
    },
    notes: event.finalNotes?.trim() || null
  };
}

export function buildAIDebriefMarkdown(context: Awaited<ReturnType<typeof buildEventDebriefContext>>) {
  const attendanceGoalProxy = Math.round(Math.max(25, context.totals.estimatedBudget / 15));
  const strengths = chooseStrengths({
    attendance: context.totals.attendance,
    attendanceGoalProxy,
    budgetVariance: context.totals.budgetVariance,
    taskCompletionRate: context.totals.taskCompletionRate,
    engagementTotal: context.marketing.totals.score
  });

  const bottlenecks = chooseBottlenecks({
    budgetVariance: context.totals.budgetVariance,
    taskCompletionRate: context.totals.taskCompletionRate,
    lockedVendorRate: context.totals.lockedVendorRate,
    overdueTaskCount: context.totals.overdueTaskCount
  });

  const highestCostVendor = context.vendors.slice().sort((a, b) => b.cost - a.cost)[0];
  const lowConfidenceVendors = context.vendors.filter((vendor) => vendor.status !== 'LOCKED_IN').map((vendor) => vendor.name);

  const budgetDirection = context.totals.budgetVariance >= 0 ? 'under budget' : 'over budget';
  const adjustments =
    context.totals.budgetVariance >= 0
      ? 'Reinvest surplus into top-performing channels and premium vendor slots.'
      : 'Increase contingency allocation and tighten pre-approval for variable-cost vendors.';

  const actionItems = [
    'Lock primary vendors at least 30 days earlier in the planning timeline.',
    'Convert checklist items into dated milestones with direct owner assignment.',
    'Reuse high-engagement post formats from this event for next season.',
    'Run midpoint budget variance review two weeks before event day.'
  ];

  return [
    '# Executive Summary',
    `${context.event.name} completed with ${context.totals.attendance} attendees, ${context.marketing.totals.score} engagement score, and finished ${budgetDirection}.`,
    '',
    '## 1) What Worked Well',
    ...strengths.map((line) => `- ${line}`),
    '',
    '## 2) Budget Performance Analysis',
    `- Estimated budget: ${formatCurrency(context.totals.estimatedBudget)}`,
    `- Actual spend: ${formatCurrency(context.totals.actualBudget)}`,
    `- Variance: ${formatCurrency(context.totals.budgetVariance)}`,
    '',
    '## 3) Vendor Performance Observations',
    `- Vendor lock-in rate: ${percentage(context.totals.lockedVendorRate)}`,
    highestCostVendor ? `- Highest cost vendor line item: ${highestCostVendor.name} (${formatCurrency(highestCostVendor.cost)})` : '- No vendor spend captured.',
    '',
    '## 4) Marketing Effectiveness Analysis',
    `- Total posts analyzed: ${context.marketing.posts.length}`,
    `- Totals: ${context.marketing.totals.likes} likes, ${context.marketing.totals.comments} comments, ${context.marketing.totals.shares} shares, ${context.marketing.totals.views} views`,
    context.marketing.topPost ? `- Top post: ${context.marketing.topPost.title} (score ${context.marketing.topPost.score})` : '- No top post identified from available data.',
    '',
    '## 5) Operational Bottlenecks',
    ...bottlenecks.map((line) => `- ${line}`),
    '',
    '## 6) Recommendations for Next Year',
    '- Establish a fixed template-driven vendor shortlist by event type.',
    '- Use weekly milestone checks for event and vendor task streams.',
    '- Connect post cadence to event timeline milestones for consistent awareness.',
    '',
    '## 7) Suggested Vendor Changes',
    lowConfidenceVendors.length > 0
      ? `- Review/replace backup candidates for: ${lowConfidenceVendors.join(', ')}`
      : '- Keep current vendor stack; all captured vendors reached locked status.',
    '',
    '## 8) Suggested Budget Adjustments',
    `- ${adjustments}`,
    '',
    '## 9) Action Items for Future Planning',
    ...actionItems.map((item) => `- ${item}`),
    '',
    '## 10) Final Notes',
    context.notes ?? 'No additional final notes were recorded on the event.'
  ].join('\n');
}

export async function generateAndSaveAIDebrief(params: {
  eventId: string;
  generatedById: string;
  mode: 'GENERATE' | 'REGENERATE';
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      status: true
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.status !== 'COMPLETED') {
    throw new Error('AI debrief is available only for completed events');
  }

  const latest = await prisma.eventDebrief.findFirst({
    where: { eventId: params.eventId },
    orderBy: { version: 'desc' }
  });

  const version = latest ? latest.version + 1 : 1;
  const context = await buildEventDebriefContext(params.eventId);
  const content = buildAIDebriefMarkdown(context);

  return prisma.eventDebrief.create({
    data: {
      eventId: params.eventId,
      version,
      generatedById: params.generatedById,
      content
    },
    include: {
      generatedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

export async function updateEventDebriefContent(params: { debriefId: string; content: string }) {
  if (!params.content.trim()) {
    throw new Error('Debrief content is required');
  }

  return prisma.eventDebrief.update({
    where: { id: params.debriefId },
    data: {
      content: params.content.trim()
    }
  });
}

export async function listEventDebriefs(eventId: string) {
  return prisma.eventDebrief.findMany({
    where: { eventId },
    orderBy: { version: 'desc' },
    include: {
      generatedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}
