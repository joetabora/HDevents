import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatCurrency } from '@/lib/utils/format';
import type { getAnnualIntelligence } from './services/intelligenceEngine';

type AnnualIntelligence = Awaited<ReturnType<typeof getAnnualIntelligence>>;

function drawHeader(page: import('pdf-lib').PDFPage, bold: import('pdf-lib').PDFFont, year: number) {
  const black = rgb(0.04, 0.04, 0.05);
  const orange = rgb(1, 0.42, 0.0);
  const white = rgb(0.98, 0.98, 0.98);

  page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: black });
  page.drawRectangle({ x: 0, y: 738, width: 612, height: 4, color: orange });
  page.drawText(`RALLY OPS ANNUAL INTELLIGENCE ${year}`, {
    x: 36,
    y: 760,
    size: 14,
    font: bold,
    color: white
  });
}

export async function buildAnnualIntelligencePdf(data: AnnualIntelligence) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.63, 0.63, 0.67);
  const orange = rgb(1, 0.42, 0.0);

  let page = pdf.addPage([612, 792]);
  drawHeader(page, bold, data.year);
  let y = 710;

  const ensureSpace = (required = 24) => {
    if (y > required) {
      return;
    }

    page = pdf.addPage([612, 792]);
    drawHeader(page, bold, data.year);
    y = 710;
  };

  const drawSection = (title: string, lines: string[]) => {
    ensureSpace(80);
    page.drawText(title, {
      x: 36,
      y,
      size: 12,
      font: bold,
      color: orange
    });
    y -= 18;

    for (const line of lines) {
      ensureSpace(28);
      page.drawText(line, {
        x: 36,
        y,
        size: 10,
        font,
        color: muted
      });
      y -= 14;
    }

    y -= 8;
  };

  drawSection('Year Summary', [
    `Total events: ${data.summary.totalEvents}`,
    `Estimated budget: ${formatCurrency(data.summary.totalEstimatedBudget)}`,
    `Actual spend: ${formatCurrency(data.summary.totalActualSpend)}`,
    `Total attendance: ${data.summary.totalAttendance}`,
    `Average attendance/event: ${data.summary.averageAttendancePerEvent}`,
    `Marketing posts: ${data.summary.totalMarketingPosts}`,
    `Engagement score: ${data.summary.totalEngagementScore}`
  ]);

  drawSection('Top / Bottom Events', [
    `Top performing: ${data.summary.topPerformingEvent ? `${data.summary.topPerformingEvent.name} (${data.summary.topPerformingEvent.efficiencyScore})` : 'N/A'}`,
    `Lowest performing: ${data.summary.lowestPerformingEvent ? `${data.summary.lowestPerformingEvent.name} (${data.summary.lowestPerformingEvent.efficiencyScore})` : 'N/A'}`
  ]);

  drawSection('Vendor Analysis', [
    `Most used vendor: ${data.summary.mostUsedVendor ? `${data.summary.mostUsedVendor.vendorName} (${data.summary.mostUsedVendor.usageCount})` : 'N/A'}`,
    `Highest cost vendor: ${data.summary.highestCostVendor ? `${data.summary.highestCostVendor.vendorName} (${formatCurrency(data.summary.highestCostVendor.totalCost)})` : 'N/A'}`,
    `Vendor consistency score: ${data.summary.vendorConsistencyScore}`
  ]);

  drawSection('Ranking Snapshots', [
    ...data.ranking.byROI.slice(0, 3).map((row, index) => `ROI #${index + 1}: ${row.name} (${row.roiScore.toFixed(4)})`),
    ...data.ranking.byEngagement.slice(0, 3).map((row, index) => `Engagement #${index + 1}: ${row.name} (${row.engagement})`),
    ...data.ranking.byAttendanceGrowth.slice(0, 3).map((row, index) => `Attendance Growth #${index + 1}: ${row.name} (${row.attendanceGrowth})`)
  ]);

  drawSection('Chart Data (Monthly)', [
    ...data.charts.budgetVsActual.map((row) => `${row.month}: Budget ${formatCurrency(row.estimated)} | Actual ${formatCurrency(row.actual)}`),
    ...data.charts.attendanceTrend.map((row) => `${row.month}: Attendance ${row.attendance}`),
    ...data.charts.engagementTrend.map((row) => `${row.month}: Engagement ${row.engagement}`)
  ]);

  drawSection('AI Summary', [data.summaryParagraph]);

  return pdf.save();
}
