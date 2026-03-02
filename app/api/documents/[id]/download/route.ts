import { NextResponse } from 'next/server';
import { readDocumentBuffer } from '@/modules/documents/services';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const file = await readDocumentBuffer(params.id);
    const bytes = new Uint8Array(file.buffer.byteLength);
    bytes.set(file.buffer);
    const body = new Blob([bytes], { type: 'application/octet-stream' });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.fileName}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Document not found' },
      { status: 404 }
    );
  }
}
