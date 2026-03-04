import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { parseContactSource, parseContactStatus, parseContactType } from '@/lib/types/crm';
import { createContact } from '@/modules/contacts/services';
import { parseCategory } from '@/modules/events/validators';
import { logActivity } from '@/modules/users/activity';
import { requireEditPermission } from '@/modules/users/server';

export async function POST(request: Request) {
  try {
    const user = await requireEditPermission();
    const formData = await request.formData();

    const firstName = String(formData.get('firstName') ?? '').trim();
    const lastName = String(formData.get('lastName') ?? '').trim();
    const businessName = String(formData.get('businessName') ?? '').trim();
    const company = String(formData.get('company') ?? '').trim();
    const category = parseCategory(String(formData.get('category') ?? 'MISC').trim());
    const contactType = parseContactType(String(formData.get('contactType') ?? 'VENDOR').trim());
    const source = parseContactSource(String(formData.get('source') ?? 'OTHER').trim());
    const status = parseContactStatus(String(formData.get('status') ?? 'NEW').trim());
    const assignedToId = String(formData.get('assignedToId') ?? '').trim() || null;

    if (!businessName && !firstName && !company) {
      return NextResponse.json({ message: 'Provide a name, business, or company' }, { status: 400 });
    }

    const created = await createContact({
      firstName,
      lastName,
      businessName,
      company,
      category,
      contactName: String(formData.get('contactName') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      contactType,
      source,
      status,
      assignedToId
    });

    await logActivity({
      userId: user.id,
      action: 'CONTACT_CREATED',
      entityType: 'CONTACT',
      entityId: created.id
    });

    revalidatePath('/contacts');
    revalidatePath('/events');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create contact' },
      { status: 500 }
    );
  }
}
