import { type Category } from '@/lib/types/domain';
import { prisma } from '@/lib/db/prisma';
import { parseCategory } from '@/modules/events/validators';

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
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function listContactsForSelection() {
  const contacts = await prisma.contact.findMany({
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

export async function updateContact(params: {
  id: string;
  businessName: string;
  category: Category;
  contactName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}) {
  return prisma.contact.update({
    where: { id: params.id },
    data: {
      businessName: params.businessName,
      category: params.category,
      contactName: params.contactName || null,
      email: params.email || null,
      phone: params.phone || null,
      notes: params.notes || null
    }
  });
}

export async function createContact(params: {
  businessName: string;
  category: Category;
  contactName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}) {
  return prisma.contact.create({
    data: {
      businessName: params.businessName,
      category: params.category,
      contactName: params.contactName || null,
      email: params.email || null,
      phone: params.phone || null,
      notes: params.notes || null
    }
  });
}

export async function deleteContact(contactId: string) {
  return prisma.contact.delete({ where: { id: contactId } });
}
