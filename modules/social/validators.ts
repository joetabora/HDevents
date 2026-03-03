import {
  isSocialPlatform,
  isSocialPostStatus,
  isSocialPostType,
  type SocialPlatform,
  type SocialPostStatus,
  type SocialPostType
} from '@/lib/types/social';

export function parseSocialStatus(value: string): SocialPostStatus {
  if (!isSocialPostStatus(value)) {
    throw new Error('Invalid social post status');
  }

  return value;
}

export function parseSocialType(value: string): SocialPostType {
  if (!isSocialPostType(value)) {
    throw new Error('Invalid social post type');
  }

  return value;
}

export function parseSocialPlatforms(values: string[]): SocialPlatform[] {
  const unique = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  const parsed = unique.filter(isSocialPlatform);

  if (parsed.length === 0) {
    throw new Error('At least one valid platform is required');
  }

  return parsed;
}
