import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { type Category, type EventStatus, type ItemStatus } from '@/lib/types/domain';
import { writeBinaryToStorage } from '@/lib/utils/file-storage';
import { saveItemDocuments } from '@/modules/documents/services';
import { buildEventReportPdf } from './report';

export type EventWithItems = Prisma.EventGetPayload<{
  include: {
    items: {
      include: {
        contact: true;
        documents: true;
      };
      orderBy: { createdAt: 'desc' };
    };
  };
}>;

export async function listEvents() {
  const events = await prisma.event.findMany({
    include: {
      items: {
        select: {
          fee: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });

  return events.map((event) => {
    const totalAllocated = event.items.reduce((sum, item) => sum + item.fee, 0);

    return {
      id: event.id,
      name: event.name,
      date: event.date,
      budget: event.budget,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      totalAllocated,
      remainingBudget: event.budget - totalAllocated,
      itemsCount: event.items.length
    };
  });
}

export async function createEvent(params: {
  name: string;
  date: Date;
  budget: number;
  createdById?: string | null;
  assignedToId?: string | null;
}) {
  return prisma.event.create({
    data: {
      name: params.name,
      date: params.date,
      budget: params.budget,
      createdById: params.createdById ?? null,
      assignedToId: params.assignedToId ?? null
    }
  });
}

export async function deleteEvent(eventId: string) {
  return prisma.event.delete({ where: { id: eventId } });
}

export async function getEventById(eventId: string): Promise<EventWithItems | null> {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      items: {
        include: {
          contact: true,
          documents: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export async function getEventFinancials(eventId: string): Promise<{ totalAllocated: number; remainingBudget: number }> {
  const [event, aggregate] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { budget: true } }),
    prisma.item.aggregate({
      where: { eventId },
      _sum: { fee: true }
    })
  ]);

  if (!event) {
    throw new Error('Event not found');
  }

  const totalAllocated = aggregate._sum.fee ?? 0;

  return {
    totalAllocated,
    remainingBudget: event.budget - totalAllocated
  };
}

export function groupItemsByCategory(items: EventWithItems['items']): Record<Category, EventWithItems['items']> {
  return {
    FOOD: items.filter((item) => item.category === 'FOOD'),
    ENTERTAINMENT: items.filter((item) => item.category === 'ENTERTAINMENT'),
    MERCH: items.filter((item) => item.category === 'MERCH'),
    PERMIT: items.filter((item) => item.category === 'PERMIT'),
    MISC: items.filter((item) => item.category === 'MISC')
  };
}

export async function createItemForEvent(params: {
  eventId: string;
  name: string;
  category: Category;
  fee: number;
  notes?: string;
  status?: ItemStatus;
  contactId?: string;
  newContact?: {
    businessName?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
  files?: File[];
}) {
  let resolvedContactId = params.contactId?.trim() ? params.contactId : null;

  if (!resolvedContactId && params.newContact?.businessName?.trim()) {
    const createdContact = await prisma.contact.create({
      data: {
        businessName: params.newContact.businessName.trim(),
        category: params.category,
        contactName: params.newContact.contactName?.trim() || null,
        phone: params.newContact.phone?.trim() || null,
        email: params.newContact.email?.trim() || null,
        notes: params.newContact.notes?.trim() || null
      }
    });

    resolvedContactId = createdContact.id;
  }

  const createdItem = await prisma.item.create({
    data: {
      eventId: params.eventId,
      name: params.name,
      category: params.category,
      fee: params.fee,
      notes: params.notes?.trim() || null,
      status: params.status ?? 'PROSPECT',
      contactId: resolvedContactId
    }
  });

  if (params.files && params.files.length > 0) {
    await saveItemDocuments({
      itemId: createdItem.id,
      files: params.files
    });
  }

  return createdItem;
}

export async function updateItemStatus(itemId: string, status: ItemStatus) {
  return prisma.item.update({
    where: { id: itemId },
    data: { status }
  });
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  return prisma.event.update({
    where: { id: eventId },
    data: { status }
  });
}

export async function updateEventBudget(eventId: string, budget: number) {
  return prisma.event.update({
    where: { id: eventId },
    data: { budget }
  });
}

export async function finishEventAndGenerateReport(eventId: string): Promise<{ pdfBytes: Uint8Array; fileName: string }> {
  const event = await getEventById(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  const { totalAllocated, remainingBudget } = await getEventFinancials(eventId);

  await updateEventStatus(eventId, 'FINISHED');

  const pdfBytes = await buildEventReportPdf({
    event,
    totalAllocated,
    remainingBudget
  });

  const baseFileName = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.pdf`;

  await writeBinaryToStorage({
    kind: 'reports',
    originalFileName: baseFileName,
    buffer: Buffer.from(pdfBytes)
  });

  return {
    pdfBytes,
    fileName: baseFileName
  };
}
