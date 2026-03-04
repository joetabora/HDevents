export const CATEGORY_VALUES = ['FOOD', 'ENTERTAINMENT', 'MERCH', 'PERMIT', 'MISC'] as const;
export const ITEM_STATUS_VALUES = ['PROSPECT', 'CONTACTED', 'LOCKED_IN'] as const;
export const EVENT_STATUS_VALUES = ['PLANNING', 'ACTIVE', 'COMPLETED'] as const;

export type Category = (typeof CATEGORY_VALUES)[number];
export type ItemStatus = (typeof ITEM_STATUS_VALUES)[number];
export type EventStatus = (typeof EVENT_STATUS_VALUES)[number];

export function isCategory(value: string): value is Category {
  return CATEGORY_VALUES.includes(value as Category);
}

export function isItemStatus(value: string): value is ItemStatus {
  return ITEM_STATUS_VALUES.includes(value as ItemStatus);
}

export function isEventStatus(value: string): value is EventStatus {
  return EVENT_STATUS_VALUES.includes(value as EventStatus);
}
