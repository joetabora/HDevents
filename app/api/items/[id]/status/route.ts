import { NextResponse } from 'next/server';
import { assertItemEventEditableByRole, updateItemStatus } from '@/modules/events/services';
import { parseItemStatus } from '@/modules/events/validators';
import { logActivity } from '@/modules/users/activity';
import { requireEditPermission } from '@/modules/users/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const itemId = params.id;

  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const statusInput = body?.status;

  if (!statusInput) {
    return NextResponse.json({ message: 'Status is required' }, { status: 400 });
  }

  try {
    const user = await requireEditPermission();
    const status = parseItemStatus(statusInput);
    const context = await assertItemEventEditableByRole({
      itemId,
      role: user.role
    });
    const updated = await updateItemStatus(itemId, status);

    if (context.status === 'COMPLETED' && user.role === 'ADMIN') {
      await logActivity({
        userId: user.id,
        action: 'EVENT_EDITED_AFTER_COMPLETION',
        entityType: 'EVENT',
        entityId: context.eventId
      });
    }

    if (updated.status === 'LOCKED_IN') {
      await logActivity({
        userId: user.id,
        action: 'VENDOR_LOCKED_IN',
        entityType: 'VENDOR',
        entityId: itemId
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update status' },
      { status: 400 }
    );
  }
}
