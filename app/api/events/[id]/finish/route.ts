import { NextResponse } from 'next/server';
import { finishEventAndGenerateReport } from '@/modules/events/services';
import { logActivity } from '@/modules/users/activity';
import { requireEditPermission } from '@/modules/users/server';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireEditPermission();
    const result = await finishEventAndGenerateReport(params.id);
    await logActivity({
      userId: user.id,
      action: 'EVENT_FINISHED',
      entityType: 'EVENT',
      entityId: params.id
    });
    const bytes = new Uint8Array(result.pdfBytes.byteLength);
    bytes.set(result.pdfBytes);
    const body = new Blob([bytes], { type: 'application/pdf' });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'x-report-filename': result.fileName
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to finish event' },
      { status: 500 }
    );
  }
}
