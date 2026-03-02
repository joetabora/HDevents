import { NextResponse } from 'next/server';
import { updateItemStatus } from '@/modules/events/services';
import { parseItemStatus } from '@/modules/events/validators';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const itemId = params.id;

  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const statusInput = body?.status;

  if (!statusInput) {
    return NextResponse.json({ message: 'Status is required' }, { status: 400 });
  }

  try {
    const status = parseItemStatus(statusInput);
    await updateItemStatus(itemId, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update status' },
      { status: 400 }
    );
  }
}
