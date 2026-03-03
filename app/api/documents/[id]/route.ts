import { NextResponse } from 'next/server';
import { deleteDocument } from '@/modules/documents/services';
import { requireDeletePermission } from '@/modules/users/server';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireDeletePermission();
    await deleteDocument(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete document' },
      { status: 400 }
    );
  }
}
