import { NextResponse } from 'next/server';
import { finalizeEvent } from '@/modules/events/services';
import { logActivity } from '@/modules/users/activity';
import { requireEditPermission } from '@/modules/users/server';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireEditPermission();
    await finalizeEvent({
      eventId: params.id,
      finalizedById: user.id,
      finalizedByName: user.name
    });

    await logActivity({
      userId: user.id,
      action: 'EVENT_COMPLETED',
      entityType: 'EVENT',
      entityId: params.id
    });

    await logActivity({
      userId: user.id,
      action: 'ARCHIVE_GENERATED',
      entityType: 'EVENT',
      entityId: params.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to finalize event' },
      { status: 500 }
    );
  }
}
