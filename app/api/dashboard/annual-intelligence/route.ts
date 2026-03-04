import { NextResponse } from 'next/server';
import { buildAnnualIntelligencePdf } from '@/modules/dashboard/intelligenceReport';
import { getAnnualIntelligence } from '@/modules/dashboard/services/intelligenceEngine';
import { canViewExecutiveOverview } from '@/modules/users/permissions';
import { requireCurrentUserAction } from '@/modules/users/server';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUserAction();
    if (!canViewExecutiveOverview(user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const yearInput = Number(url.searchParams.get('year') ?? new Date().getFullYear());
    const year = Number.isFinite(yearInput) && yearInput > 2000 && yearInput < 3000 ? Math.floor(yearInput) : new Date().getFullYear();

    const intelligence = await getAnnualIntelligence(year);
    const pdfBytes = await buildAnnualIntelligencePdf(intelligence);
    const bytes = new Uint8Array(pdfBytes.byteLength);
    bytes.set(pdfBytes);
    const body = new Blob([bytes], { type: 'application/pdf' });
    const fileName = `rally-ops-annual-intelligence-${year}.pdf`;

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
      { message: error instanceof Error ? error.message : 'Unable to generate annual intelligence report' },
      { status: 500 }
    );
  }
}
