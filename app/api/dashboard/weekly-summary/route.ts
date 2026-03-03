import { NextResponse } from 'next/server';
import { getWeeklySummaryData } from '@/modules/dashboard/services';
import { buildWeeklySummaryPdf } from '@/modules/dashboard/report';
import { canViewExecutiveOverview } from '@/modules/users/permissions';
import { requireCurrentUserAction } from '@/modules/users/server';

export async function GET() {
  try {
    const user = await requireCurrentUserAction();

    if (!canViewExecutiveOverview(user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await getWeeklySummaryData();
    const pdfBytes = await buildWeeklySummaryPdf(data);
    const bytes = new Uint8Array(pdfBytes.byteLength);
    bytes.set(pdfBytes);
    const body = new Blob([bytes], { type: 'application/pdf' });
    const fileName = `rally-ops-weekly-summary-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'x-report-filename': fileName
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to generate summary' },
      { status: 500 }
    );
  }
}
