import { type Category } from '@/lib/types/domain';
import {
  type ContactSource,
  type ContactStatus,
  type ContactType,
  type InteractionType,
  parseContactSource,
  parseContactStatus,
  parseContactType
} from '@/lib/types/crm';
import { prisma } from '@/lib/db/prisma';
import { parseCategory } from '@/modules/events/validators';

function fullName(firstName?: string | null, lastName?: string | null): string {
  const combined = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return combined;
}

function inferBusinessName(params: {
  businessName?: string;
  company?: string;
  firstName?: string;
  lastName?: string;
}): string {
  const direct = params.businessName?.trim();
  if (direct) {
    return direct;
  }

  const company = params.company?.trim();
  if (company) {
    return company;
  }

  const name = fullName(params.firstName, params.lastName);
  return name || 'Unnamed Contact';
}

function inferContactName(params: { contactName?: string; firstName?: string; lastName?: string }): string | null {
  const direct = params.contactName?.trim();
  if (direct) {
    return direct;
  }

  const combined = fullName(params.firstName, params.lastName);
  return combined || null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function leadScoreFromSignals(params: {
  status: string;
  interactionTypes: string[];
  attendedEvents: number;
  requestedQuote: boolean;
  repeatContact: boolean;
}): number {
  let score = 0;

  const responded = params.interactionTypes.some((type) => ['CALL', 'EMAIL', 'MEETING', 'TEXT'].includes(type)) || ['CONTACTED', 'ACTIVE', 'CLOSED'].includes(params.status);
  if (responded) {
    score += 10;
  }

  if (params.attendedEvents > 0) {
    score += 20;
  }

  if (params.requestedQuote) {
    score += 30;
  }

  if (params.repeatContact) {
    score += 50;
  }

  return clamp(score, 0, 100);
}

export async function recomputeLeadScore(contactId: string): Promise<number> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      interactions: {
        select: {
          type: true,
          summary: true
        }
      },
      eventLinks: {
        include: {
          event: {
            select: {
              status: true
            }
          }
        }
      },
      items: {
        include: {
          event: {
            select: {
              status: true
            }
          }
        }
      }
    }
  });

  if (!contact) {
    throw new Error('Contact not found');
  }

  const attendedEventCount = contact.eventLinks.filter((link) => link.event.status === 'COMPLETED').length;
  const vendorEventCount = contact.items.filter((item) => item.event.status === 'COMPLETED').length;
  const eventCount = attendedEventCount + vendorEventCount;
  const interactionTypes = contact.interactions.map((interaction) => interaction.type);
  const requestedQuote =
    (contact.notes ?? '').toLowerCase().includes('quote') ||
    contact.interactions.some((interaction) => interaction.summary.toLowerCase().includes('quote'));
  const repeatContact = contact.interactions.length >= 3;

  const score = leadScoreFromSignals({
    status: contact.status,
    interactionTypes,
    attendedEvents: eventCount,
    requestedQuote,
    repeatContact
  });

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      leadScore: score
    }
  });

  return score;
}

export async function listContacts(category?: Category) {
  return prisma.contact.findMany({
    where: category ? { category } : undefined,
    include: {
      items: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true
            }
          }
        }
      },
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
  });
}

export async function listCRMContacts(params?: {
  search?: string;
  contactType?: ContactType;
  assignedToId?: string;
  status?: ContactStatus;
}) {
  const search = params?.search?.trim();

  const contacts = await prisma.contact.findMany({
    where: {
      contactType: params?.contactType,
      assignedToId: params?.assignedToId?.trim() || undefined,
      status: params?.status,
      OR: search
        ? [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { businessName: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        : undefined
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      _count: {
        select: {
          interactions: true,
          items: true,
          eventLinks: true,
          socialLinks: true
        }
      }
    }
  });

  return contacts
    .map((contact) => ({
      ...contact,
      displayName: fullName(contact.firstName, contact.lastName) || contact.contactName || contact.businessName,
      lastInteractionAt: contact.interactions[0]?.createdAt ?? null
    }))
    .sort((a, b) => {
      const aDate = a.lastInteractionAt?.getTime() ?? a.updatedAt.getTime();
      const bDate = b.lastInteractionAt?.getTime() ?? b.updatedAt.getTime();
      return bDate - aDate;
    });
}

export async function listContactsForSelection() {
  const contacts = await prisma.contact.findMany({
    where: {
      contactType: 'VENDOR'
    },
    orderBy: { businessName: 'asc' },
    select: {
      id: true,
      businessName: true,
      category: true,
      contactName: true,
      email: true,
      phone: true
    }
  });

  return contacts.map((contact) => ({
    ...contact,
    category: parseCategory(contact.category)
  }));
}

export async function listEventsForContactSelection() {
  return prisma.event.findMany({
    orderBy: { date: 'desc' },
    select: {
      id: true,
      name: true,
      date: true,
      status: true
    },
    take: 100
  });
}

export async function listContactLinkOptions() {
  const contacts = await prisma.contact.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      contactName: true,
      businessName: true,
      company: true,
      contactType: true,
      status: true
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 250
  });

  return contacts.map((contact) => ({
    // Keep options resilient to legacy rows that may predate CRM enums.
    // Fallbacks avoid hard failures in selection modals.
    id: contact.id,
    displayName: fullName(contact.firstName, contact.lastName) || contact.contactName || contact.businessName,
    company: contact.company || contact.businessName,
    contactType: (() => {
      try {
        return parseContactType(contact.contactType);
      } catch {
        return 'VENDOR';
      }
    })(),
    status: (() => {
      try {
        return parseContactStatus(contact.status);
      } catch {
        return 'NEW';
      }
    })()
  }));
}

export async function listSocialPostsForContactSelection() {
  return prisma.socialPost.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      platforms: true,
      publicLikes: true,
      publicComments: true,
      publicShares: true,
      publicViews: true,
      likes: true,
      comments: true,
      shares: true,
      views: true
    },
    take: 120
  });
}

export async function getContactProfile(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      interactions: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      items: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              status: true,
              budget: true,
              finalBudgetUsed: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      eventLinks: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      socialLinks: {
        include: {
          socialPost: {
            select: {
              id: true,
              title: true,
              status: true,
              platforms: true,
              publicLikes: true,
              publicComments: true,
              publicShares: true,
              publicViews: true,
              likes: true,
              comments: true,
              shares: true,
              views: true,
              updatedAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!contact) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { relatedType: 'CONTACT', relatedId: contact.id },
        { relatedType: 'VENDOR', relatedId: { in: contact.items.map((item) => item.id) } }
      ]
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 40
  });

  const distinctVendorEvents = new Set(contact.items.map((item) => item.eventId));
  const lockedCount = contact.items.filter((item) => item.status === 'LOCKED_IN').length;
  const lockRate = contact.items.length === 0 ? 0 : (lockedCount / contact.items.length) * 100;
  const reuseRate = clamp((distinctVendorEvents.size / 5) * 100, 0, 100);
  const vendorPerformanceScore = contact.contactType === 'VENDOR' ? Math.round(lockRate * 0.65 + reuseRate * 0.35) : null;

  return {
    ...contact,
    displayName: fullName(contact.firstName, contact.lastName) || contact.contactName || contact.businessName,
    tasks,
    vendorPerformanceScore
  };
}

export async function createContact(params: {
  businessName?: string;
  category?: Category;
  contactName?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  contactType?: ContactType;
  source?: ContactSource;
  status?: ContactStatus;
  assignedToId?: string | null;
}) {
  const contactType = params.contactType ?? 'VENDOR';
  const status = params.status ?? (contactType === 'VENDOR' ? 'ACTIVE' : 'NEW');

  const created = await prisma.contact.create({
    data: {
      firstName: params.firstName?.trim() || null,
      lastName: params.lastName?.trim() || null,
      businessName: inferBusinessName({
        businessName: params.businessName,
        company: params.company,
        firstName: params.firstName,
        lastName: params.lastName
      }),
      company: params.company?.trim() || params.businessName?.trim() || null,
      category: params.category ?? 'MISC',
      contactName: inferContactName({
        contactName: params.contactName,
        firstName: params.firstName,
        lastName: params.lastName
      }),
      phone: params.phone?.trim() || null,
      email: params.email?.trim() || null,
      notes: params.notes?.trim() || null,
      contactType,
      source: params.source ?? 'OTHER',
      status,
      assignedToId: params.assignedToId ?? null
    }
  });

  const leadScore = await recomputeLeadScore(created.id);
  return { ...created, leadScore };
}

export async function updateContact(params: {
  id: string;
  businessName?: string;
  category?: Category;
  contactName?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  contactType?: ContactType;
  source?: ContactSource;
  status?: ContactStatus;
  assignedToId?: string | null;
}) {
  const updated = await prisma.contact.update({
    where: { id: params.id },
    data: {
      firstName: params.firstName?.trim() || null,
      lastName: params.lastName?.trim() || null,
      businessName: inferBusinessName({
        businessName: params.businessName,
        company: params.company,
        firstName: params.firstName,
        lastName: params.lastName
      }),
      company: params.company?.trim() || params.businessName?.trim() || null,
      category: params.category,
      contactName: inferContactName({
        contactName: params.contactName,
        firstName: params.firstName,
        lastName: params.lastName
      }),
      email: params.email?.trim() || null,
      phone: params.phone?.trim() || null,
      notes: params.notes?.trim() || null,
      contactType: params.contactType,
      source: params.source,
      status: params.status,
      assignedToId: params.assignedToId === undefined ? undefined : params.assignedToId
    }
  });

  const leadScore = await recomputeLeadScore(updated.id);
  return { ...updated, leadScore };
}

export async function deleteContact(contactId: string) {
  return prisma.contact.delete({ where: { id: contactId } });
}

export async function createInteraction(params: {
  contactId: string;
  type: InteractionType;
  summary: string;
  followUpDate?: Date | null;
  createdById?: string | null;
}) {
  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    select: {
      id: true,
      assignedToId: true,
      firstName: true,
      lastName: true,
      contactName: true,
      businessName: true
    }
  });

  if (!contact) {
    throw new Error('Contact not found');
  }

  const interaction = await prisma.interaction.create({
    data: {
      contactId: params.contactId,
      type: params.type,
      summary: params.summary.trim(),
      followUpDate: params.followUpDate ?? null,
      createdById: params.createdById ?? null
    }
  });

  let followupTask = null as null | { id: string };

  if (params.followUpDate) {
    const display = fullName(contact.firstName, contact.lastName) || contact.contactName || contact.businessName;
    followupTask = await prisma.task.create({
      data: {
        title: `Follow up with ${display}`,
        description: params.summary.trim(),
        relatedType: 'CONTACT',
        relatedId: contact.id,
        assignedToId: contact.assignedToId ?? null,
        dueDate: params.followUpDate,
        completed: false,
        createdById: params.createdById ?? null
      },
      select: {
        id: true
      }
    });
  }

  await recomputeLeadScore(params.contactId);

  return {
    interaction,
    followupTaskId: followupTask?.id ?? null
  };
}

export async function attachContactToEvent(params: {
  contactId: string;
  eventId: string;
  roleTag?: string;
}) {
  return prisma.eventContact.upsert({
    where: {
      eventId_contactId: {
        eventId: params.eventId,
        contactId: params.contactId
      }
    },
    update: {
      roleTag: params.roleTag?.trim() || null
    },
    create: {
      eventId: params.eventId,
      contactId: params.contactId,
      roleTag: params.roleTag?.trim() || null
    }
  });
}

export async function convertEventContactToLead(params: {
  contactId: string;
  eventId: string;
  assignedToId?: string | null;
}) {
  await prisma.eventContact.upsert({
    where: {
      eventId_contactId: {
        eventId: params.eventId,
        contactId: params.contactId
      }
    },
    update: {
      convertedToLead: true
    },
    create: {
      eventId: params.eventId,
      contactId: params.contactId,
      convertedToLead: true
    }
  });

  const updated = await prisma.contact.update({
    where: { id: params.contactId },
    data: {
      contactType: 'LEAD',
      status: 'ACTIVE',
      source: 'EVENT',
      assignedToId: params.assignedToId ?? undefined
    }
  });

  const score = await recomputeLeadScore(updated.id);
  return { ...updated, leadScore: score };
}

export async function attachContactToSocialPost(params: {
  contactId: string;
  socialPostId: string;
  relationshipType?: string;
}) {
  return prisma.socialPostContact.upsert({
    where: {
      socialPostId_contactId: {
        socialPostId: params.socialPostId,
        contactId: params.contactId
      }
    },
    update: {
      relationshipType: params.relationshipType?.trim().toUpperCase() || 'COMMENTER'
    },
    create: {
      socialPostId: params.socialPostId,
      contactId: params.contactId,
      relationshipType: params.relationshipType?.trim().toUpperCase() || 'COMMENTER'
    }
  });
}

export async function createLeadFromSocialPost(params: {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  assignedToId?: string | null;
  socialPostId: string;
}) {
  const post = await prisma.socialPost.findUnique({
    where: { id: params.socialPostId },
    select: {
      id: true,
      title: true
    }
  });

  if (!post) {
    throw new Error('Social post not found');
  }

  const contact = await createContact({
    firstName: params.firstName,
    lastName: params.lastName,
    businessName: `${params.firstName} ${params.lastName ?? ''}`.trim(),
    company: 'Social Lead',
    category: 'MISC',
    phone: params.phone,
    email: params.email,
    notes: `${params.notes?.trim() || ''}\nSource Post: ${post.title}`.trim(),
    contactType: 'LEAD',
    source: 'SOCIAL',
    status: 'NEW',
    assignedToId: params.assignedToId ?? null
  });

  await attachContactToSocialPost({
    contactId: contact.id,
    socialPostId: post.id,
    relationshipType: 'HIGH_ENGAGEMENT_COMMENTER'
  });

  return contact;
}

export async function getContactById(contactId: string) {
  return prisma.contact.findUnique({ where: { id: contactId } });
}

export function normalizeContactFilters(params?: {
  type?: string;
  status?: string;
  assignedToId?: string;
  search?: string;
}) {
  return {
    contactType: params?.type ? parseContactType(params.type) : undefined,
    status: params?.status ? parseContactStatus(params.status) : undefined,
    assignedToId: params?.assignedToId?.trim() || undefined,
    search: params?.search?.trim() || undefined
  };
}

export function normalizeContactSource(value: string): ContactSource {
  return parseContactSource(value);
}

export function normalizeContactType(value: string): ContactType {
  return parseContactType(value);
}

export function normalizeContactStatus(value: string): ContactStatus {
  return parseContactStatus(value);
}
