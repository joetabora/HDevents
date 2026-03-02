import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createItemForEvent } from '@/modules/events/services';
import { parseCategory, parseItemStatus } from '@/modules/events/validators';

function parseFee(input: string): number {
  const value = Number(input);
  if (Number.isNaN(value) || value < 0) {
    throw new Error('Fee must be a valid positive number');
  }
  return value;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData();

    const name = String(formData.get('name') ?? '').trim();
    const feeInput = String(formData.get('fee') ?? '').trim();
    const category = parseCategory(String(formData.get('category') ?? '').trim());
    const status = parseItemStatus(String(formData.get('status') ?? 'PROSPECT').trim());

    if (!name || !feeInput) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const files = formData.getAll('documents').filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const newContactBusinessName = String(formData.get('newContactBusinessName') ?? '').trim();

    await createItemForEvent({
      eventId: params.id,
      name,
      fee: parseFee(feeInput),
      category,
      status,
      notes: String(formData.get('notes') ?? '').trim(),
      contactId: String(formData.get('contactId') ?? '').trim(),
      newContact: {
        businessName: newContactBusinessName,
        contactName: String(formData.get('newContactName') ?? '').trim(),
        phone: String(formData.get('newContactPhone') ?? '').trim(),
        email: String(formData.get('newContactEmail') ?? '').trim(),
        notes: String(formData.get('newContactNotes') ?? '').trim()
      },
      files
    });

    revalidatePath(`/events/${params.id}`);
    revalidatePath('/events');
    revalidatePath('/contacts');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      contactCreated: Boolean(newContactBusinessName),
      documentsUploaded: files.length
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create item' },
      { status: 500 }
    );
  }
}
