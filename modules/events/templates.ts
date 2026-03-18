import { prisma } from '@/lib/db/prisma';
import type { Category, EventType } from '@/lib/types/domain';
import { defaultEventPlaybook } from './playbook';

type BudgetCategoryRow = {
  category: Category;
  estimate: number;
};

type TemplatePriority = 'PRIMARY' | 'BACKUP';

function parseChecklist(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean);
}

function parseBudgetCategories(value: unknown): BudgetCategoryRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows: BudgetCategoryRow[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const category = String((entry as { category?: unknown }).category ?? '').toUpperCase();
    const estimateRaw = Number((entry as { estimate?: unknown }).estimate ?? 0);

    if (!['FOOD', 'ENTERTAINMENT', 'MERCH', 'PERMIT', 'MISC'].includes(category)) {
      continue;
    }

    rows.push({
      category: category as Category,
      estimate: Number.isFinite(estimateRaw) ? Math.max(0, estimateRaw) : 0
    });
  }

  return rows;
}

function normalizePriority(value: string): TemplatePriority {
  return value === 'BACKUP' ? 'BACKUP' : 'PRIMARY';
}

function cleanEventType(value?: string | null): EventType | null {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (['RALLY', 'OPEN_HOUSE', 'COMMUNITY', 'DEMO_DAY', 'SEASONAL', 'OTHER'].includes(normalized)) {
    return normalized as EventType;
  }

  return 'OTHER';
}

function milestoneDueDateFromEntry(entry: string, eventDate: Date, fallbackIndex: number, total: number): Date | null {
  const daysBeforeMatch = entry.match(/^(\d+)\s*days?\s*before[:\-]/i);
  if (daysBeforeMatch) {
    const daysBefore = Number(daysBeforeMatch[1]);
    const due = new Date(eventDate);
    due.setDate(due.getDate() - daysBefore);
    return due;
  }

  const datePrefixMatch = entry.match(/^(\d{4}-\d{2}-\d{2})\s*[:\-]/);
  if (datePrefixMatch) {
    const parsed = new Date(datePrefixMatch[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const fallbackWeeks = Math.max(0, total - fallbackIndex);
  const fallback = new Date(eventDate);
  fallback.setDate(fallback.getDate() - fallbackWeeks * 7);
  return fallback;
}

async function getVendorUsageCountMap(contactIds: string[], eventType: EventType | null): Promise<Map<string, number>> {
  if (contactIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.item.findMany({
    where: {
      contactId: { in: contactIds },
      event: {
        status: 'COMPLETED',
        ...(eventType ? { eventType } : {})
      }
    },
    select: {
      contactId: true,
      eventId: true
    }
  });

  const byVendor = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.contactId) {
      continue;
    }

    const existing = byVendor.get(row.contactId) ?? new Set<string>();
    existing.add(row.eventId);
    byVendor.set(row.contactId, existing);
  }

  return new Map(Array.from(byVendor.entries()).map(([vendorId, eventIds]) => [vendorId, eventIds.size]));
}

export async function listEventTemplates(params?: { includeArchived?: boolean }) {
  const includeArchived = Boolean(params?.includeArchived);
  const templates = await prisma.eventTemplate.findMany({
    where: includeArchived ? undefined : { archivedAt: null },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      templateVendors: {
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              category: true,
              contactName: true
            }
          }
        },
        orderBy: [{ priorityLevel: 'asc' }, { createdAt: 'asc' }]
      },
      events: {
        select: {
          id: true,
          date: true
        },
        orderBy: {
          date: 'desc'
        }
      }
    },
    orderBy: [{ archivedAt: 'asc' }, { updatedAt: 'desc' }]
  });

  const mapped = [] as Array<{
    id: string;
    name: string;
    description: string | null;
    eventType: EventType | null;
    budgetCategories: BudgetCategoryRow[];
    taskChecklist: string[];
    timelineMilestones: string[];
    createdAt: Date;
    archivedAt: Date | null;
    usageCount: number;
    lastUsedDate: Date | null;
    vendors: Array<{
      id: string;
      vendorId: string;
      priorityLevel: TemplatePriority;
      defaultCostEstimate: number | null;
      category: Category;
      vendor: {
        id: string;
        businessName: string;
        category: string;
        contactName: string | null;
      };
      suggestedByHistory: boolean;
      usageCountForType: number;
    }>;
  }>;

  for (const template of templates) {
    const eventType = cleanEventType(template.eventType);
    const vendorIds = template.templateVendors.map((vendor) => vendor.vendorId);
    const usageMap = await getVendorUsageCountMap(vendorIds, eventType);

    mapped.push({
      id: template.id,
      name: template.name,
      description: template.description,
      eventType,
      budgetCategories: parseBudgetCategories(template.defaultBudgetCategories),
      taskChecklist: parseChecklist(template.defaultTaskChecklist),
      timelineMilestones: parseChecklist(template.timelineMilestones),
      createdAt: template.createdAt,
      archivedAt: template.archivedAt,
      usageCount: template.events.length,
      lastUsedDate: template.events[0]?.date ?? null,
      vendors: template.templateVendors.map((vendor) => {
        const usageCountForType = usageMap.get(vendor.vendorId) ?? 0;
        return {
          id: vendor.id,
          vendorId: vendor.vendorId,
          priorityLevel: normalizePriority(vendor.priorityLevel),
          defaultCostEstimate: vendor.defaultCostEstimate,
          category: vendor.category as Category,
          vendor: vendor.vendor,
          suggestedByHistory: normalizePriority(vendor.priorityLevel) === 'BACKUP' && usageCountForType >= 3,
          usageCountForType
        };
      })
    });
  }

  return mapped;
}

export async function getEventTemplateById(templateId: string) {
  const template = await prisma.eventTemplate.findUnique({
    where: { id: templateId },
    include: {
      templateVendors: {
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              category: true,
              contactName: true
            }
          }
        },
        orderBy: [{ priorityLevel: 'asc' }, { createdAt: 'asc' }]
      }
    }
  });

  if (!template) {
    return null;
  }

  const eventType = cleanEventType(template.eventType);
  const vendorIds = template.templateVendors.map((vendor) => vendor.vendorId);
  const usageMap = await getVendorUsageCountMap(vendorIds, eventType);

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    eventType,
    archivedAt: template.archivedAt,
    budgetCategories: parseBudgetCategories(template.defaultBudgetCategories),
    taskChecklist: parseChecklist(template.defaultTaskChecklist),
    timelineMilestones: parseChecklist(template.timelineMilestones),
    vendors: template.templateVendors.map((vendor) => ({
      id: vendor.id,
      vendorId: vendor.vendorId,
      defaultCostEstimate: vendor.defaultCostEstimate,
      category: vendor.category as Category,
      priorityLevel: normalizePriority(vendor.priorityLevel),
      vendor: vendor.vendor,
      suggestedByHistory: normalizePriority(vendor.priorityLevel) === 'BACKUP' && (usageMap.get(vendor.vendorId) ?? 0) >= 3,
      usageCountForType: usageMap.get(vendor.vendorId) ?? 0
    }))
  };
}

export async function saveEventAsTemplate(params: {
  eventId: string;
  name: string;
  description?: string;
  createdById: string;
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      items: {
        include: {
          contact: true
        }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const relatedTasks = await prisma.task.findMany({
    where: {
      relatedType: 'EVENT',
      relatedId: event.id
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }]
  });

  const budgetByCategory = new Map<Category, number>();
  for (const item of event.items) {
    const category = item.category as Category;
    const current = budgetByCategory.get(category) ?? 0;
    budgetByCategory.set(category, current + item.fee);
  }

  const budgetCategories = Array.from(budgetByCategory.entries()).map(([category, estimate]) => ({
    category,
    estimate: Math.round(estimate * 100) / 100
  }));

  const taskChecklist = relatedTasks
    .map((task) => task.title.trim())
    .filter(Boolean);

  const timelineMilestones = relatedTasks
    .filter((task) => Boolean(task.dueDate))
    .map((task) => {
      const dueDate = task.dueDate ?? event.date;
      const daysDiff = Math.round((event.date.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      const prefix = daysDiff > 0 ? `${daysDiff} days before` : daysDiff < 0 ? `${Math.abs(daysDiff)} days after` : 'Event day';
      return `${prefix}: ${task.title}`;
    });

  const vendorMap = new Map<
    string,
    {
      vendorId: string;
      category: Category;
      defaultCostEstimate: number;
      priorityLevel: TemplatePriority;
    }
  >();

  for (const item of event.items) {
    if (!item.contactId) {
      continue;
    }

    const existing = vendorMap.get(item.contactId);
    const priorityFromStatus: TemplatePriority = item.status === 'LOCKED_IN' ? 'PRIMARY' : 'BACKUP';

    if (!existing) {
      vendorMap.set(item.contactId, {
        vendorId: item.contactId,
        category: item.category as Category,
        defaultCostEstimate: item.fee,
        priorityLevel: priorityFromStatus
      });
      continue;
    }

    if (priorityFromStatus === 'PRIMARY') {
      existing.priorityLevel = 'PRIMARY';
    }
  }

  return prisma.eventTemplate.create({
    data: {
      name: params.name.trim(),
      description: params.description?.trim() || null,
      eventType: event.eventType,
      defaultBudgetCategories: budgetCategories,
      defaultTaskChecklist: taskChecklist,
      timelineMilestones,
      createdById: params.createdById,
      templateVendors: {
        create: Array.from(vendorMap.values()).map((vendor) => ({
          vendorId: vendor.vendorId,
          defaultCostEstimate: vendor.defaultCostEstimate,
          category: vendor.category,
          priorityLevel: vendor.priorityLevel
        }))
      }
    }
  });
}

export async function updateEventTemplate(params: {
  templateId: string;
  name: string;
  description?: string | null;
  eventType?: EventType | null;
  budgetCategories: BudgetCategoryRow[];
  taskChecklist: string[];
  timelineMilestones: string[];
}) {
  return prisma.eventTemplate.update({
    where: { id: params.templateId },
    data: {
      name: params.name.trim(),
      description: params.description?.trim() || null,
      eventType: params.eventType ?? null,
      defaultBudgetCategories: params.budgetCategories,
      defaultTaskChecklist: params.taskChecklist,
      timelineMilestones: params.timelineMilestones
    }
  });
}

export async function duplicateEventTemplate(params: { templateId: string; userId: string }) {
  const template = await prisma.eventTemplate.findUnique({
    where: { id: params.templateId },
    include: {
      templateVendors: true
    }
  });

  if (!template) {
    throw new Error('Template not found');
  }

  return prisma.eventTemplate.create({
    data: {
      name: `${template.name} (Copy)`,
      description: template.description,
      eventType: template.eventType,
      defaultBudgetCategories: template.defaultBudgetCategories ?? undefined,
      defaultTaskChecklist: template.defaultTaskChecklist ?? undefined,
      timelineMilestones: template.timelineMilestones ?? undefined,
      createdById: params.userId,
      templateVendors: {
        create: template.templateVendors.map((vendor) => ({
          vendorId: vendor.vendorId,
          defaultCostEstimate: vendor.defaultCostEstimate,
          category: vendor.category,
          priorityLevel: vendor.priorityLevel
        }))
      }
    }
  });
}

export async function archiveEventTemplate(templateId: string) {
  return prisma.eventTemplate.update({
    where: { id: templateId },
    data: {
      archivedAt: new Date()
    }
  });
}

export async function createEventFromTemplate(params: {
  templateId: string;
  name: string;
  date: Date;
  budget: number;
  eventType?: EventType | null;
  assignedToId?: string | null;
  createdById?: string | null;
  selectedBackupVendorIds?: string[];
}) {
  const template = await getEventTemplateById(params.templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  if (template.archivedAt) {
    throw new Error('Archived templates cannot be used to create events');
  }

  const selectedBackupVendorIds = new Set(params.selectedBackupVendorIds ?? []);
  const primaryVendors = template.vendors.filter((vendor) => vendor.priorityLevel === 'PRIMARY');
  const backupVendors = template.vendors.filter((vendor) => vendor.priorityLevel === 'BACKUP');

  const autoSuggestedBackupIds = new Set(
    backupVendors
      .filter((vendor) => vendor.suggestedByHistory)
      .map((vendor) => vendor.vendorId)
  );

  const selectedVendors = [
    ...primaryVendors,
    ...backupVendors.filter((vendor) => selectedBackupVendorIds.has(vendor.vendorId) || autoSuggestedBackupIds.has(vendor.vendorId))
  ];

  const playbook = defaultEventPlaybook();
  const checklistRows = template.taskChecklist
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => ({
      id: `template-checklist-${index + 1}`,
      title: entry,
      item: entry,
      description: '',
      ownerId: params.assignedToId ?? '',
      dueDate: '',
      status: 'NOT_STARTED' as const,
      completed: false,
      notes: ''
    }));

  const milestoneRows = template.timelineMilestones
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const title = entry.includes(':') ? entry.split(':').slice(1).join(':').trim() || entry : entry;
      const dueDate = milestoneDueDateFromEntry(entry, params.date, index + 1, template.timelineMilestones.length);
      return {
        id: `template-milestone-${index + 1}`,
        title,
        ownerId: params.assignedToId ?? '',
        dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : '',
        status: 'NOT_STARTED' as const,
        completed: false,
        notes: ''
      };
    });

  const createdEvent = await prisma.event.create({
    data: {
      name: params.name.trim(),
      date: params.date,
      budget: params.budget,
      status: 'PLANNING',
      eventType: params.eventType ?? template.eventType ?? null,
      templateId: template.id,
      playbook: {
        ...playbook,
        theme: template.name,
        checklist: checklistRows.length > 0 ? checklistRows : playbook.checklist,
        weekFlow: {
          ...playbook.weekFlow,
          monday: milestoneRows
        }
      },
      createdById: params.createdById ?? null,
      assignedToId: params.assignedToId ?? null
    }
  });

  if (selectedVendors.length > 0) {
    await prisma.item.createMany({
      data: selectedVendors.map((vendor) => ({
        eventId: createdEvent.id,
        name: vendor.vendor.businessName,
        category: vendor.category,
        fee: Math.max(0, vendor.defaultCostEstimate ?? 0),
        status: vendor.priorityLevel === 'PRIMARY' ? 'CONTACTED' : 'PROSPECT',
        contactId: vendor.vendorId
      }))
    });
  }

  const checklist = template.taskChecklist.map((entry) => entry.trim()).filter(Boolean);
  const milestones = template.timelineMilestones.map((entry) => entry.trim()).filter(Boolean);

  if (checklist.length > 0) {
    await prisma.task.createMany({
      data: checklist.map((title) => ({
        title,
        relatedType: 'EVENT',
        relatedId: createdEvent.id,
        assignedToId: params.assignedToId ?? null,
        createdById: params.createdById ?? null,
        completed: false
      }))
    });
  }

  if (milestones.length > 0) {
    await prisma.task.createMany({
      data: milestones.map((entry, index) => ({
        title: entry.includes(':') ? entry.split(':').slice(1).join(':').trim() || entry : entry,
        relatedType: 'EVENT',
        relatedId: createdEvent.id,
        assignedToId: params.assignedToId ?? null,
        dueDate: milestoneDueDateFromEntry(entry, params.date, index + 1, milestones.length),
        createdById: params.createdById ?? null,
        completed: false
      }))
    });
  }

  return {
    event: createdEvent,
    autoAddedVendors: primaryVendors.map((vendor) => vendor.vendor.businessName),
    suggestedBackupVendors: backupVendors
      .filter((vendor) => autoSuggestedBackupIds.has(vendor.vendorId))
      .map((vendor) => vendor.vendor.businessName)
  };
}

export async function duplicateEvent(params: {
  eventId: string;
  name: string;
  date: Date;
  budget: number;
  assignedToId?: string | null;
  createdById?: string | null;
}) {
  const source = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      items: true
    }
  });

  if (!source) {
    throw new Error('Source event not found');
  }

  const tasks = await prisma.task.findMany({
    where: {
      relatedType: 'EVENT',
      relatedId: source.id
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }]
  });

  const duplicated = await prisma.event.create({
    data: {
      name: params.name.trim(),
      date: params.date,
      budget: params.budget,
      eventType: source.eventType,
      status: 'PLANNING',
      templateId: source.templateId,
      playbook: source.playbook ?? defaultEventPlaybook(),
      createdById: params.createdById ?? null,
      assignedToId: params.assignedToId ?? null
    }
  });

  if (source.items.length > 0) {
    await prisma.item.createMany({
      data: source.items.map((item) => ({
        eventId: duplicated.id,
        name: item.name,
        category: item.category,
        fee: item.fee,
        status: item.status,
        notes: item.notes,
        contactId: item.contactId
      }))
    });
  }

  if (tasks.length > 0) {
    await prisma.task.createMany({
      data: tasks.map((task) => ({
        title: task.title,
        description: task.description,
        relatedType: 'EVENT',
        relatedId: duplicated.id,
        assignedToId: params.assignedToId ?? task.assignedToId ?? null,
        dueDate: task.dueDate,
        completed: false,
        createdById: params.createdById ?? null
      }))
    });
  }

  return duplicated;
}
