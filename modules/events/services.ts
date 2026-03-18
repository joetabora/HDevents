import { readFile } from 'node:fs/promises';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { type Category, type EventStatus, type ItemStatus } from '@/lib/types/domain';
import { saveItemDocuments, resolveFileAbsolutePath } from '@/modules/documents/services';
import type { UserRole } from '@/modules/users/constants';
import { defaultEventPlaybook, type EventPlaybook } from './playbook';
import { generateEventArchiveVersion, regenerateEventArchiveFiles } from './services/archiveGenerator';

export type EventWithItems = Prisma.EventGetPayload<{
  include: {
    items: {
      include: {
        contact: true;
        documents: true;
      };
      orderBy: { createdAt: 'desc' };
    };
    finalizedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    archives: {
      orderBy: { version: 'desc' };
      include: {
        generatedBy: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    debriefs: {
      orderBy: { version: 'desc' };
      include: {
        generatedBy: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    contactLinks: {
      orderBy: { createdAt: 'desc' };
      include: {
        contact: {
          include: {
            assignedTo: {
              select: {
                id: true;
                name: true;
                email: true;
              };
            };
          };
        };
      };
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
      eventType: event.eventType,
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
  eventType?: string | null;
  createdById?: string | null;
  assignedToId?: string | null;
}) {
  return prisma.event.create({
    data: {
      name: params.name,
      date: params.date,
      budget: params.budget,
      eventType: params.eventType ?? null,
      playbook: defaultEventPlaybook(),
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
      },
      finalizedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      archives: {
        orderBy: { version: 'desc' },
        include: {
          generatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      debriefs: {
        orderBy: { version: 'desc' },
        include: {
          generatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      contactLinks: {
        orderBy: { createdAt: 'desc' },
        include: {
          contact: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
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

export async function updateEventPlaybook(eventId: string, playbook: EventPlaybook) {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      playbook
    }
  });
}

export async function getEventMutationContext(eventId: string): Promise<{ eventId: string; status: EventStatus }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      status: true
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  return {
    eventId: event.id,
    status: event.status as EventStatus
  };
}

export async function getItemEventMutationContext(itemId: string): Promise<{ eventId: string; status: EventStatus }> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      event: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!item?.event) {
    throw new Error('Item not found');
  }

  return {
    eventId: item.event.id,
    status: item.event.status as EventStatus
  };
}

export async function getDocumentEventMutationContext(documentId: string): Promise<{ eventId: string; status: EventStatus }> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      item: {
        select: {
          event: {
            select: {
              id: true,
              status: true
            }
          }
        }
      }
    }
  });

  if (!document?.item.event) {
    throw new Error('Document not found');
  }

  return {
    eventId: document.item.event.id,
    status: document.item.event.status as EventStatus
  };
}

export async function assertEventEditableByRole(params: { eventId: string; role: UserRole }): Promise<{ eventId: string; status: EventStatus }> {
  const context = await getEventMutationContext(params.eventId);
  if (context.status === 'COMPLETED' && params.role !== 'ADMIN') {
    throw new Error('Completed events are locked for non-admin users');
  }
  return context;
}

export async function assertItemEventEditableByRole(params: { itemId: string; role: UserRole }): Promise<{ eventId: string; status: EventStatus }> {
  const context = await getItemEventMutationContext(params.itemId);
  if (context.status === 'COMPLETED' && params.role !== 'ADMIN') {
    throw new Error('Completed events are locked for non-admin users');
  }
  return context;
}

function sanitizeFileSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'event';
}

function archiveFileName(eventName: string, version: number, suffix: string): string {
  return `${sanitizeFileSegment(eventName)}-v${version}-${suffix}`;
}

export async function finalizeEvent(params: {
  eventId: string;
  finalizedById: string;
  finalizedByName: string;
  finalAttendance?: number | null;
  finalBudgetUsed?: number | null;
  finalNotes?: string | null;
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      status: true,
      archiveVersion: true
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.status === 'COMPLETED') {
    throw new Error('Event is already completed');
  }

  const nextVersion = event.archiveVersion + 1;

  const updatedEvent = await prisma.event.update({
    where: { id: params.eventId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      finalizedById: params.finalizedById,
      finalAttendance: params.finalAttendance ?? null,
      finalBudgetUsed: params.finalBudgetUsed ?? null,
      finalNotes: params.finalNotes?.trim() ? params.finalNotes.trim() : null,
      archiveVersion: nextVersion
    }
  });

  const archive = await generateEventArchiveVersion({
    eventId: params.eventId,
    version: nextVersion,
    generatedById: params.finalizedById,
    generatedByName: params.finalizedByName
  });

  return {
    event: updatedEvent,
    archive
  };
}

export async function reopenEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      status: true
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.status !== 'COMPLETED') {
    throw new Error('Only completed events can be reopened');
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: 'ACTIVE',
      completedAt: null,
      finalizedById: null,
      finalAttendance: null,
      finalBudgetUsed: null,
      finalNotes: null
    }
  });
}

export async function regenerateEventArchive(params: {
  eventId: string;
  generatedById: string;
  generatedByName: string;
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      status: true
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.status !== 'COMPLETED') {
    throw new Error('Only completed events can generate archives');
  }

  const updated = await prisma.event.update({
    where: { id: params.eventId },
    data: {
      archiveVersion: {
        increment: 1
      }
    },
    select: {
      archiveVersion: true
    }
  });

  const archive = await generateEventArchiveVersion({
    eventId: params.eventId,
    version: updated.archiveVersion,
    generatedById: params.generatedById,
    generatedByName: params.generatedByName
  });

  return {
    version: updated.archiveVersion,
    archive
  };
}

export async function listEventArchives(eventId: string) {
  return prisma.eventArchive.findMany({
    where: { eventId },
    orderBy: { version: 'desc' },
    include: {
      generatedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      event: {
        select: {
          name: true
        }
      }
    }
  });
}

export async function readEventArchiveAsset(params: {
  eventId: string;
  archiveId: string;
  kind: 'zip' | 'pdf';
}): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
  const archive = await prisma.eventArchive.findFirst({
    where: {
      id: params.archiveId,
      eventId: params.eventId
    },
    include: {
      event: {
        select: {
          name: true
        }
      },
      generatedBy: {
        select: {
          name: true
        }
      }
    }
  });

  if (!archive) {
    throw new Error('Archive not found');
  }

  const filePath = params.kind === 'zip' ? archive.archiveUrl : archive.summaryPdfUrl;
  let buffer: Buffer;

  try {
    buffer = await readFile(resolveFileAbsolutePath(filePath));
  } catch (error) {
    const ioError = error as NodeJS.ErrnoException;
    if (ioError.code !== 'ENOENT') {
      throw error;
    }

    const regenerated = await regenerateEventArchiveFiles({
      eventId: archive.eventId,
      version: archive.version,
      generatedByName: archive.generatedBy?.name ?? 'System'
    });

    await prisma.eventArchive.update({
      where: { id: archive.id },
      data: {
        archiveUrl: regenerated.archiveUrl,
        summaryPdfUrl: regenerated.summaryPdfUrl,
        budgetCsvUrl: regenerated.budgetCsvUrl,
        vendorCsvUrl: regenerated.vendorCsvUrl,
        socialCsvUrl: regenerated.socialCsvUrl
      }
    });

    const refreshedPath = params.kind === 'zip' ? regenerated.archiveUrl : regenerated.summaryPdfUrl;
    buffer = await readFile(resolveFileAbsolutePath(refreshedPath));
  }

  return {
    buffer,
    contentType: params.kind === 'zip' ? 'application/zip' : 'application/pdf',
    fileName:
      params.kind === 'zip'
        ? archiveFileName(archive.event.name, archive.version, 'archive.zip')
        : archiveFileName(archive.event.name, archive.version, 'summary.pdf')
  };
}
