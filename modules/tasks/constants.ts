export const TASK_RELATED_TYPES = ['EVENT', 'SOCIAL', 'VENDOR', 'GENERAL'] as const;

export type TaskRelatedType = (typeof TASK_RELATED_TYPES)[number];

export function isTaskRelatedType(value: string): value is TaskRelatedType {
  return TASK_RELATED_TYPES.includes(value as TaskRelatedType);
}

export function parseTaskRelatedType(value: string): TaskRelatedType {
  if (!isTaskRelatedType(value)) {
    throw new Error('Invalid task related type');
  }

  return value;
}
