import { isCategory, isEventStatus, isItemStatus, type Category, type EventStatus, type ItemStatus } from '@/lib/types/domain';

export function parseCategory(value: string): Category {
  if (isCategory(value)) {
    return value;
  }

  throw new Error('Invalid category value');
}

export function parseItemStatus(value: string): ItemStatus {
  if (isItemStatus(value)) {
    return value;
  }

  throw new Error('Invalid item status value');
}

export function parseEventStatus(value: string): EventStatus {
  const normalized = value === 'READY' ? 'ACTIVE' : value === 'FINISHED' ? 'COMPLETED' : value;

  if (isEventStatus(normalized)) {
    return normalized;
  }

  throw new Error('Invalid event status value');
}
