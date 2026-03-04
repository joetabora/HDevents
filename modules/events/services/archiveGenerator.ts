import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '@/lib/db/prisma';
import { resolveFileAbsolutePath } from '@/modules/documents/services';
import { writeBinaryToStorage } from '@/lib/utils/file-storage';
import { formatCurrency, formatDate } from '@/lib/utils/format';

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'event';
}

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function scoreFromMetrics(metrics: { likes: number; comments: number; shares: number; views: number }): number {
  return Math.round(metrics.likes + metrics.comments * 3 + metrics.shares * 5 + metrics.views / 10);
}

function folderForItemCategory(category: string): 'Permits' | 'Contracts' | 'Marketing' | 'Misc' {
  if (category === 'PERMIT') {
    return 'Permits';
  }

  if (category === 'MERCH') {
    return 'Marketing';
  }

  if (category === 'MISC') {
    return 'Misc';
  }

  return 'Contracts';
}

function toIsoDateTime(value: Date | null | undefined): string {
  return value ? new Date(value).toISOString() : '';
}

function buildBudgetCsv(params: {
  eventName: string;
  estimatedBudget: number;
  actualBudgetUsed: number;
  items: Array<{ name: string; category: string; fee: number; status: string }>;
}) {
  const variance = params.estimatedBudget - params.actualBudgetUsed;

  const rows = [
    ['Event', params.eventName],
    ['Estimated Budget', params.estimatedBudget],
    ['Actual Budget Used', params.actualBudgetUsed],
    ['Variance', variance],
    [],
    ['Vendor', 'Category', 'Cost', 'Status'],
    ...params.items.map((item) => [item.name, item.category, item.fee, item.status])
  ];

  return rows
    .map((row) => row.map((cell) => csvEscape(cell as string | number | null | undefined)).join(','))
    .join('\n');
}

function buildVendorCsv(items: Array<{ name: string; category: string; fee: number; status: string; contactName: string; businessName: string }>) {
  const rows = [
    ['Name', 'Category', 'Cost', 'Paid Status', 'Business', 'Contact'],
    ...items.map((item) => [
      item.name,
      item.category,
      item.fee,
      item.status === 'LOCKED_IN' ? 'PAID' : 'PENDING',
      item.businessName,
      item.contactName
    ])
  ];

  return rows
    .map((row) => row.map((cell) => csvEscape(cell as string | number | null | undefined)).join(','))
    .join('\n');
}

function buildSocialCsv(
  posts: Array<{
    title: string;
    status: string;
    scheduledFor: Date | null;
    postedAt: Date | null;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    publicLikes: number;
    publicComments: number;
    publicShares: number;
    publicViews: number;
  }>
) {
  const rows = [
    ['Post', 'Status', 'Scheduled', 'Posted', 'Likes', 'Comments', 'Shares', 'Views', 'Engagement Score'],
    ...posts.map((post) => {
      const likes = post.publicLikes > 0 ? post.publicLikes : post.likes;
      const comments = post.publicComments > 0 ? post.publicComments : post.comments;
      const shares = post.publicShares > 0 ? post.publicShares : post.shares;
      const views = post.publicViews > 0 ? post.publicViews : post.views;

      return [
        post.title,
        post.status,
        toIsoDateTime(post.scheduledFor),
        toIsoDateTime(post.postedAt),
        likes,
        comments,
        shares,
        views,
        scoreFromMetrics({ likes, comments, shares, views })
      ];
    })
  ];

  return rows
    .map((row) => row.map((cell) => csvEscape(cell as string | number | null | undefined)).join(','))
    .join('\n');
}

async function buildEventSummaryPdf(params: {
  event: {
    name: string;
    date: Date;
    status: string;
    budget: number;
    finalAttendance: number | null;
    finalBudgetUsed: number | null;
    finalNotes: string | null;
    archiveVersion: number;
  };
  generatedAt: Date;
  generatedByName: string;
  items: Array<{ name: string; category: string; fee: number; status: string; contactName: string; businessName: string }>;
  social: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    topPostTitle: string;
    topScore: number;
  };
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const bg = rgb(0.05, 0.05, 0.06);
  const card = rgb(0.09, 0.09, 0.11);
  const text = rgb(0.98, 0.98, 0.98);
  const muted = rgb(0.66, 0.66, 0.7);
  const accent = rgb(1, 0.42, 0);

  const drawFooter = (page: import('pdf-lib').PDFPage, pageNumber: number, totalPages: number) => {
    const footerY = 20;
    page.drawLine({ start: { x: 36, y: footerY + 14 }, end: { x: 576, y: footerY + 14 }, thickness: 0.6, color: accent });
    page.drawText(`Archive v${params.event.archiveVersion} • ${formatDate(params.generatedAt)} • ${params.generatedByName}`, {
      x: 36,
      y: footerY,
      size: 9,
      font: fontRegular,
      color: muted
    });
    page.drawText(`Page ${pageNumber} / ${totalPages}`, {
      x: 520,
      y: footerY,
      size: 9,
      font: fontRegular,
      color: muted
    });
  };

  const createPage = () => {
    const page = pdf.addPage([612, 792]);
    page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: bg });
    page.drawRectangle({ x: 0, y: 780, width: 612, height: 4, color: accent });
    return page;
  };

  const cover = createPage();
  cover.drawText(params.event.name, { x: 48, y: 680, size: 30, font: fontBold, color: text });
  cover.drawText('Event Summary Archive', { x: 48, y: 648, size: 14, font: fontRegular, color: muted });
  cover.drawRectangle({ x: 48, y: 596, width: 516, height: 1, color: accent });
  cover.drawText(`Date: ${formatDate(params.event.date)}`, { x: 48, y: 560, size: 12, font: fontRegular, color: text });
  cover.drawText(`Location: Not specified`, { x: 48, y: 540, size: 12, font: fontRegular, color: text });
  cover.drawText(`Status: ${params.event.status}`, { x: 48, y: 520, size: 12, font: fontRegular, color: text });

  const overview = createPage();
  overview.drawText('Overview', { x: 48, y: 720, size: 18, font: fontBold, color: text });
  overview.drawRectangle({ x: 48, y: 698, width: 516, height: 1, color: accent });
  overview.drawText(`Description: ${params.event.finalNotes?.slice(0, 160) || 'No description provided.'}`, {
    x: 48,
    y: 670,
    size: 11,
    font: fontRegular,
    color: muted,
    maxWidth: 516,
    lineHeight: 16
  });
  overview.drawText(`Final attendance: ${params.event.finalAttendance ?? 0}`, { x: 48, y: 610, size: 12, font: fontRegular, color: text });
  overview.drawText(`Goals vs outcome: Goal data not captured. Outcome documented in final notes.`, {
    x: 48,
    y: 588,
    size: 11,
    font: fontRegular,
    color: muted
  });

  const budgetPage = createPage();
  budgetPage.drawText('Budget Summary', { x: 48, y: 720, size: 18, font: fontBold, color: text });
  budgetPage.drawRectangle({ x: 48, y: 698, width: 516, height: 1, color: accent });
  const actualUsed = params.event.finalBudgetUsed ?? params.items.reduce((sum, item) => sum + item.fee, 0);
  const variance = params.event.budget - actualUsed;
  const budgetRows: Array<[string, string]> = [
    ['Estimated', formatCurrency(params.event.budget)],
    ['Actual', formatCurrency(actualUsed)],
    ['Variance', formatCurrency(variance)]
  ];
  budgetRows.forEach((row, index) => {
    const y = 650 - index * 36;
    budgetPage.drawRectangle({ x: 48, y: y - 8, width: 516, height: 28, color: card });
    budgetPage.drawText(row[0], { x: 62, y, size: 11, font: fontBold, color: text });
    budgetPage.drawText(row[1], { x: 400, y, size: 11, font: fontRegular, color: text });
  });

  const vendorPage = createPage();
  vendorPage.drawText('Vendors', { x: 48, y: 720, size: 18, font: fontBold, color: text });
  vendorPage.drawRectangle({ x: 48, y: 698, width: 516, height: 1, color: accent });
  let vendorY = 668;
  vendorPage.drawText('Name', { x: 48, y: vendorY, size: 10, font: fontBold, color: muted });
  vendorPage.drawText('Category', { x: 220, y: vendorY, size: 10, font: fontBold, color: muted });
  vendorPage.drawText('Cost', { x: 340, y: vendorY, size: 10, font: fontBold, color: muted });
  vendorPage.drawText('Paid', { x: 440, y: vendorY, size: 10, font: fontBold, color: muted });
  vendorY -= 18;

  for (const item of params.items.slice(0, 18)) {
    vendorPage.drawText(item.name.slice(0, 24), { x: 48, y: vendorY, size: 10, font: fontRegular, color: text });
    vendorPage.drawText(item.category, { x: 220, y: vendorY, size: 10, font: fontRegular, color: muted });
    vendorPage.drawText(formatCurrency(item.fee), { x: 340, y: vendorY, size: 10, font: fontRegular, color: text });
    vendorPage.drawText(item.status === 'LOCKED_IN' ? 'YES' : 'NO', { x: 440, y: vendorY, size: 10, font: fontRegular, color: text });
    vendorY -= 18;
  }

  const marketing = createPage();
  marketing.drawText('Marketing Performance', { x: 48, y: 720, size: 18, font: fontBold, color: text });
  marketing.drawRectangle({ x: 48, y: 698, width: 516, height: 1, color: accent });
  const marketingLines = [
    `Total posts: ${params.social.totalPosts}`,
    `Engagement totals: ${params.social.totalLikes} likes • ${params.social.totalComments} comments • ${params.social.totalShares} shares • ${params.social.totalViews} views`,
    `Top performing post: ${params.social.topPostTitle || 'None'}`,
    `Engagement score: ${params.social.topScore}`
  ];
  marketingLines.forEach((line, index) => {
    marketing.drawText(line, { x: 48, y: 660 - index * 24, size: 12, font: fontRegular, color: text });
  });

  const debrief = createPage();
  debrief.drawText('Internal Debrief', { x: 48, y: 720, size: 18, font: fontBold, color: text });
  debrief.drawRectangle({ x: 48, y: 698, width: 516, height: 1, color: accent });
  debrief.drawText(params.event.finalNotes || 'No final notes were submitted.', {
    x: 48,
    y: 660,
    size: 11,
    font: fontRegular,
    color: muted,
    maxWidth: 516,
    lineHeight: 16
  });

  const pages = pdf.getPages();
  pages.forEach((page, index) => drawFooter(page, index + 1, pages.length));

  return pdf.save();
}

export async function generateEventArchiveVersion(params: {
  eventId: string;
  version: number;
  generatedById: string;
  generatedByName: string;
}) {
  const artifacts = await generateEventArchiveArtifacts({
    eventId: params.eventId,
    version: params.version,
    generatedByName: params.generatedByName
  });

  const archive = await prisma.eventArchive.create({
    data: {
      eventId: params.eventId,
      version: params.version,
      generatedById: params.generatedById,
      archiveUrl: artifacts.archiveUrl,
      summaryPdfUrl: artifacts.summaryPdfUrl,
      budgetCsvUrl: artifacts.budgetCsvUrl,
      vendorCsvUrl: artifacts.vendorCsvUrl,
      socialCsvUrl: artifacts.socialCsvUrl
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

  return archive;
}

export async function regenerateEventArchiveFiles(params: {
  eventId: string;
  version: number;
  generatedByName: string;
}): Promise<{
  archiveUrl: string;
  summaryPdfUrl: string;
  budgetCsvUrl: string;
  vendorCsvUrl: string;
  socialCsvUrl: string;
}> {
  return generateEventArchiveArtifacts(params);
}

async function generateEventArchiveArtifacts(params: {
  eventId: string;
  version: number;
  generatedByName: string;
}): Promise<{
  archiveUrl: string;
  summaryPdfUrl: string;
  budgetCsvUrl: string;
  vendorCsvUrl: string;
  socialCsvUrl: string;
}> {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      items: {
        include: {
          contact: true,
          documents: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const windowStart = new Date(event.date);
  windowStart.setDate(windowStart.getDate() - 14);
  const windowEnd = new Date(event.date);
  windowEnd.setDate(windowEnd.getDate() + 14);

  const socialPosts = await prisma.socialPost.findMany({
    where: {
      OR: [
        {
          scheduledFor: {
            gte: windowStart,
            lte: windowEnd
          }
        },
        {
          postedAt: {
            gte: windowStart,
            lte: windowEnd
          }
        }
      ]
    },
    orderBy: [{ postedAt: 'desc' }, { scheduledFor: 'desc' }]
  });

  const socialWithScore = socialPosts.map((post) => {
    const likes = post.publicLikes > 0 ? post.publicLikes : post.likes;
    const comments = post.publicComments > 0 ? post.publicComments : post.comments;
    const shares = post.publicShares > 0 ? post.publicShares : post.shares;
    const views = post.publicViews > 0 ? post.publicViews : post.views;

    return {
      ...post,
      likes,
      comments,
      shares,
      views,
      score: scoreFromMetrics({ likes, comments, shares, views })
    };
  });

  const topPost = socialWithScore.sort((a, b) => b.score - a.score)[0] ?? null;

  const actualBudgetUsed = event.finalBudgetUsed ?? event.items.reduce((sum, item) => sum + item.fee, 0);
  const eventYear = event.date.getFullYear();
  const rootFolderName = `${sanitizeSegment(event.name)}-${eventYear}-v${params.version}`;

  const summaryPdfBytes = await buildEventSummaryPdf({
    event: {
      name: event.name,
      date: event.date,
      status: event.status,
      budget: event.budget,
      finalAttendance: event.finalAttendance,
      finalBudgetUsed: actualBudgetUsed,
      finalNotes: event.finalNotes,
      archiveVersion: params.version
    },
    generatedAt: new Date(),
    generatedByName: params.generatedByName,
    items: event.items.map((item) => ({
      name: item.name,
      category: item.category,
      fee: item.fee,
      status: item.status,
      contactName: item.contact?.contactName ?? '',
      businessName: item.contact?.businessName ?? ''
    })),
    social: {
      totalPosts: socialWithScore.length,
      totalLikes: socialWithScore.reduce((sum, post) => sum + post.likes, 0),
      totalComments: socialWithScore.reduce((sum, post) => sum + post.comments, 0),
      totalShares: socialWithScore.reduce((sum, post) => sum + post.shares, 0),
      totalViews: socialWithScore.reduce((sum, post) => sum + post.views, 0),
      topPostTitle: topPost?.title ?? '',
      topScore: topPost?.score ?? 0
    }
  });

  const budgetCsv = buildBudgetCsv({
    eventName: event.name,
    estimatedBudget: event.budget,
    actualBudgetUsed,
    items: event.items.map((item) => ({
      name: item.name,
      category: item.category,
      fee: item.fee,
      status: item.status
    }))
  });

  const vendorCsv = buildVendorCsv(
    event.items.map((item) => ({
      name: item.name,
      category: item.category,
      fee: item.fee,
      status: item.status,
      contactName: item.contact?.contactName ?? '',
      businessName: item.contact?.businessName ?? ''
    }))
  );

  const socialCsv = buildSocialCsv(
    socialPosts.map((post) => ({
      title: post.title,
      status: post.status,
      scheduledFor: post.scheduledFor,
      postedAt: post.postedAt,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      views: post.views,
      publicLikes: post.publicLikes,
      publicComments: post.publicComments,
      publicShares: post.publicShares,
      publicViews: post.publicViews
    }))
  );

  const summaryStored = await writeBinaryToStorage({
    kind: 'reports',
    originalFileName: `${rootFolderName}-event-summary.pdf`,
    buffer: Buffer.from(summaryPdfBytes)
  });

  const budgetStored = await writeBinaryToStorage({
    kind: 'reports',
    originalFileName: `${rootFolderName}-budget-breakdown.csv`,
    buffer: Buffer.from(budgetCsv, 'utf-8')
  });

  const vendorStored = await writeBinaryToStorage({
    kind: 'reports',
    originalFileName: `${rootFolderName}-vendor-list.csv`,
    buffer: Buffer.from(vendorCsv, 'utf-8')
  });

  const socialStored = await writeBinaryToStorage({
    kind: 'reports',
    originalFileName: `${rootFolderName}-social-performance.csv`,
    buffer: Buffer.from(socialCsv, 'utf-8')
  });

  const zip = new JSZip();
  const root = zip.folder(rootFolderName);

  if (!root) {
    throw new Error('Unable to initialize archive folder');
  }

  root.file('Event-Summary.pdf', Buffer.from(summaryPdfBytes));
  root.file('Budget-Breakdown.csv', budgetCsv);
  root.file('Vendor-List.csv', vendorCsv);
  root.file('Social-Performance.csv', socialCsv);

  for (const item of event.items) {
    for (const document of item.documents) {
      const folder = folderForItemCategory(item.category);
      const relativeName = `${sanitizeSegment(item.name)}-${document.id.slice(0, 8)}-${document.fileName}`;
      const absolutePath = resolveFileAbsolutePath(document.filePath);

      try {
        const buffer = await readFile(absolutePath);
        root.file(`${folder}/${relativeName}`, buffer);
      } catch {
        // Keep archive generation resilient for missing files.
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 8 } });
  const archiveStored = await writeBinaryToStorage({
    kind: 'archives',
    originalFileName: `${rootFolderName}.zip`,
    buffer: zipBuffer
  });

  return {
    archiveUrl: archiveStored.dbPath,
    summaryPdfUrl: summaryStored.dbPath,
    budgetCsvUrl: budgetStored.dbPath,
    vendorCsvUrl: vendorStored.dbPath,
    socialCsvUrl: socialStored.dbPath
  };
}
