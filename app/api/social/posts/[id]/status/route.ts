import { NextResponse } from 'next/server';
import { updateSocialPostStatus } from '@/modules/social/services';
import { parseSocialStatus } from '@/modules/social/validators';
import { requireEditPermission } from '@/modules/users/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const statusValue = body?.status;

  if (!statusValue) {
    return NextResponse.json({ message: 'Status is required' }, { status: 400 });
  }

  try {
    await requireEditPermission();
    const status = parseSocialStatus(statusValue);
    await updateSocialPostStatus(params.id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to update social post status' },
      { status: 400 }
    );
  }
}
