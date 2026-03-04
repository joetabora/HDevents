import { NextResponse } from 'next/server';
import { readEventArchiveAsset } from '@/modules/events/services';
import { requireCurrentUserAction } from '@/modules/users/server';

export async function GET(request: Request, { params }: { params: { id: string; archiveId: string } }) {
  try {
    await requireCurrentUserAction();

    const url = new URL(request.url);
    const kindParam = url.searchParams.get('kind');
    const kind = kindParam === 'pdf' ? 'pdf' : kindParam === 'zip' ? 'zip' : null;

    if (!kind) {
      return NextResponse.json({ message: 'Invalid archive asset kind' }, { status: 400 });
    }

    const file = await readEventArchiveAsset({
      eventId: params.id,
      archiveId: params.archiveId,
      kind
    });

    const bytes = new Uint8Array(file.buffer.byteLength);
    bytes.set(file.buffer);
    const body = new Blob([bytes], { type: file.contentType });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Archive not found' },
      { status: 404 }
    );
  }
}
