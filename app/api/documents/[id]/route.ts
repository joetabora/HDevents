import { NextResponse } from 'next/server';
import { deleteDocument } from '@/modules/documents/services';
import { getDocumentEventMutationContext } from '@/modules/events/services';
import { logActivity } from '@/modules/users/activity';
import { requireDeletePermission } from '@/modules/users/server';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireDeletePermission();
    const context = await getDocumentEventMutationContext(params.id);
    await deleteDocument(params.id);

    if (context.status === 'COMPLETED') {
      await logActivity({
        userId: user.id,
        action: 'EVENT_EDITED_AFTER_COMPLETION',
        entityType: 'EVENT',
        entityId: context.eventId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete document' },
      { status: 400 }
    );
  }
}
