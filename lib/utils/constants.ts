import { CATEGORY_VALUES, EVENT_TYPE_VALUES, ITEM_STATUS_VALUES, type Category, type EventType, type ItemStatus } from '@/lib/types/domain';

export const categoryLabels: Record<Category, string> = {
  FOOD: 'Food Vendors',
  ENTERTAINMENT: 'Entertainment',
  MERCH: 'Merchandise Vendors',
  PERMIT: 'Permits',
  MISC: 'Miscellaneous'
};

export const statusLabels: Record<ItemStatus, string> = {
  PROSPECT: 'Prospect',
  CONTACTED: 'Contacted',
  LOCKED_IN: 'Locked In'
};

export const eventTypeLabels: Record<EventType, string> = {
  RALLY: 'Rally',
  OPEN_HOUSE: 'Open House',
  COMMUNITY: 'Community',
  DEMO_DAY: 'Demo Day',
  SEASONAL: 'Seasonal',
  OTHER: 'Other'
};

export const categoryValues = [...CATEGORY_VALUES];
export const itemStatusValues = [...ITEM_STATUS_VALUES];
export const eventTypeValues = [...EVENT_TYPE_VALUES];
