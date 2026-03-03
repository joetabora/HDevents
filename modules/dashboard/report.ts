import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatCurrency } from '@/lib/utils/format';

export async function buildWeeklySummaryPdf(data: {
  usedBikesPosted: number;
  engagementTotals: { likes: number; comments: number; shares: number; views: number };
  topPost: { title: string; score: number } | null;
  activeEvents: number;
  budget: { totalBudget: number; totalSpent: number };
  operations: { openTasks: number; overdueTasks: number; documentsUploadedThisWeek: number };
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0.04, 0.04, 0.05);
  const white = rgb(0.98, 0.98, 0.98);
  const orange = rgb(1, 0.42, 0.0);
  const muted = rgb(0.63, 0.63, 0.67);

  page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: black });
  page.drawRectangle({ x: 0, y: 738, width: 612, height: 4, color: orange });

  page.drawText('RALLY OPS WEEKLY SUMMARY', {
    x: 36,
    y: 760,
    size: 14,
    font: bold,
    color: white
  });

  let y = 700;

  const drawSection = (title: string, lines: string[]) => {
    page.drawText(title, {
      x: 36,
      y,
      size: 12,
      font: bold,
      color: orange
    });
    y -= 20;

    for (const line of lines) {
      page.drawText(line, {
        x: 36,
        y,
        size: 11,
        font,
        color: muted
      });
      y -= 16;
    }

    y -= 10;
  };

  drawSection('Marketing', [
    `Used bikes posted today: ${data.usedBikesPosted}`,
    `Engagement totals: ${data.engagementTotals.likes} likes | ${data.engagementTotals.comments} comments | ${data.engagementTotals.shares} shares | ${data.engagementTotals.views} views`,
    `Top post: ${data.topPost ? `${data.topPost.title} (Score ${data.topPost.score})` : 'None'}`
  ]);

  drawSection('Events', [
    `Active events: ${data.activeEvents}`,
    `Budget total: ${formatCurrency(data.budget.totalBudget)}`,
    `Budget spent: ${formatCurrency(data.budget.totalSpent)}`,
    `Budget remaining: ${formatCurrency(data.budget.totalBudget - data.budget.totalSpent)}`
  ]);

  drawSection('Operations', [
    `Open tasks: ${data.operations.openTasks}`,
    `Overdue tasks: ${data.operations.overdueTasks}`,
    `Documents uploaded this week: ${data.operations.documentsUploadedThisWeek}`
  ]);

  return pdf.save();
}
