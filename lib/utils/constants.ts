import { CATEGORY_VALUES, ITEM_STATUS_VALUES, type Category, type ItemStatus } from '@/lib/types/domain';

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

export const categoryValues = [...CATEGORY_VALUES];
export const itemStatusValues = [...ITEM_STATUS_VALUES];
