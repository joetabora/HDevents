import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createContact } from '@/modules/contacts/services';
import { parseCategory } from '@/modules/events/validators';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const businessName = String(formData.get('businessName') ?? '').trim();
    const category = parseCategory(String(formData.get('category') ?? '').trim());

    if (!businessName) {
      return NextResponse.json({ message: 'Business name is required' }, { status: 400 });
    }

    await createContact({
      businessName,
      category,
      contactName: String(formData.get('contactName') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim()
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
