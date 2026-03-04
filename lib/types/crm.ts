export const CONTACT_TYPES = ['LEAD', 'VENDOR', 'SPONSOR', 'MEDIA', 'CUSTOMER', 'INTERNAL'] as const;
export const CONTACT_SOURCES = ['EVENT', 'SOCIAL', 'WALKIN', 'REFERRAL', 'OTHER'] as const;
export const CONTACT_STATUSES = ['NEW', 'CONTACTED', 'ACTIVE', 'CLOSED', 'LOST'] as const;
export const INTERACTION_TYPES = ['CALL', 'EMAIL', 'MEETING', 'TEXT', 'NOTE'] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];
export type ContactSource = (typeof CONTACT_SOURCES)[number];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export function isContactType(value: string): value is ContactType {
  return CONTACT_TYPES.includes(value as ContactType);
}

export function isContactSource(value: string): value is ContactSource {
  return CONTACT_SOURCES.includes(value as ContactSource);
}

export function isContactStatus(value: string): value is ContactStatus {
  return CONTACT_STATUSES.includes(value as ContactStatus);
}

export function isInteractionType(value: string): value is InteractionType {
  return INTERACTION_TYPES.includes(value as InteractionType);
}

export function parseContactType(value: string): ContactType {
  const normalized = value.trim().toUpperCase();
  if (!isContactType(normalized)) {
    throw new Error('Invalid contact type');
  }
  return normalized;
}

export function parseContactSource(value: string): ContactSource {
  const normalized = value.trim().toUpperCase();
  if (!isContactSource(normalized)) {
    throw new Error('Invalid contact source');
  }
  return normalized;
}

export function parseContactStatus(value: string): ContactStatus {
  const normalized = value.trim().toUpperCase();
  if (!isContactStatus(normalized)) {
    throw new Error('Invalid contact status');
  }
  return normalized;
}

export function parseInteractionType(value: string): InteractionType {
  const normalized = value.trim().toUpperCase();
  if (!isInteractionType(normalized)) {
    throw new Error('Invalid interaction type');
  }
  return normalized;
}
