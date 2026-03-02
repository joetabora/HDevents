import { type Prisma } from '@prisma/client';
import { type Category } from '@/lib/types/domain';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { categoryLabels } from '@/lib/utils/constants';
import { formatCurrency, formatDate } from '@/lib/utils/format';

const categoryOrder: Category[] = ['FOOD', 'ENTERTAINMENT', 'MERCH', 'PERMIT', 'MISC'];

type EventWithItems = Prisma.EventGetPayload<{
  include: {
    items: {
      include: {
        contact: true;
        documents: true;
      };
    };
  };
}>;

export async function buildEventReportPdf(params: {
  event: EventWithItems;
  totalAllocated: number;
  remainingBudget: number;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([612, 792]);
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margins = { top: 50, right: 50, bottom: 50, left: 50 };
  let y = 792 - margins.top;

  const ensureSpace = (needed = 20) => {
    if (y - needed < margins.bottom) {
      page = pdf.addPage([612, 792]);
      y = 792 - margins.top;
    }
  };

  const drawText = (text: string, options?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> }) => {
    ensureSpace((options?.size ?? 10) + 6);
    page.drawText(text, {
      x: margins.left,
      y,
      size: options?.size ?? 10,
      font: options?.bold ? boldFont : regularFont,
      color: options?.color ?? rgb(0, 0, 0)
    });
    y -= (options?.size ?? 10) + 6;
  };

  drawText('Event Operations Report', { size: 20, bold: true });
  drawText(`Event: ${params.event.name}`, { size: 12, bold: true });
  drawText(`Date: ${formatDate(params.event.date)}`);
  drawText(`Status: ${params.event.status}`);
  drawText('');
  drawText('Budget Summary', { size: 13, bold: true });
  drawText(`Total Budget: ${formatCurrency(params.event.budget)}`);
  drawText(`Total Allocated: ${formatCurrency(params.totalAllocated)}`);
  drawText(`Remaining Budget: ${formatCurrency(params.remainingBudget)}`);
  drawText('');

  for (const category of categoryOrder) {
    const categoryItems = params.event.items.filter((item) => item.category === category);
    if (categoryItems.length === 0) {
      continue;
    }

    const lockedItems = categoryItems.filter((item) => item.status === 'LOCKED_IN');
    const otherItems = categoryItems.filter((item) => item.status !== 'LOCKED_IN');
    const orderedItems = [...lockedItems, ...otherItems];
    const totalCategoryFees = categoryItems.reduce((sum, item) => sum + item.fee, 0);

    drawText(categoryLabels[category], { size: 13, bold: true, color: rgb(0.05, 0.38, 0.35) });
    drawText(`Category Total: ${formatCurrency(totalCategoryFees)}`, { bold: true });

    for (const item of orderedItems) {
      const isLocked = item.status === 'LOCKED_IN';
      drawText(
        `${isLocked ? '[LOCKED IN] ' : ''}${item.name} | ${formatCurrency(item.fee)} | ${item.status}`,
        { bold: isLocked }
      );

      if (item.contact) {
        drawText(`Contact: ${item.contact.businessName}${item.contact.contactName ? ` (${item.contact.contactName})` : ''}`);
      }

      if (item.documents.length > 0) {
        drawText(`Documents: ${item.documents.map((doc) => doc.fileName).join(', ')}`);
      }

      if (item.notes) {
        drawText(`Notes: ${item.notes}`);
      }

      drawText('');
    }
  }

  return pdf.save();
}
