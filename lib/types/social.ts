export const SOCIAL_POST_STATUSES = ['IDEA', 'FILMING', 'EDITING', 'SCHEDULED', 'POSTED'] as const;
export const SOCIAL_POST_TYPES = ['USED_BIKE', 'BRAND', 'EVENT', 'COMMUNITY', 'PROMO'] as const;
export const SOCIAL_PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE'] as const;

export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number];
export type SocialPostType = (typeof SOCIAL_POST_TYPES)[number];
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export function isSocialPostStatus(value: string): value is SocialPostStatus {
  return SOCIAL_POST_STATUSES.includes(value as SocialPostStatus);
}

export function isSocialPostType(value: string): value is SocialPostType {
  return SOCIAL_POST_TYPES.includes(value as SocialPostType);
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return SOCIAL_PLATFORMS.includes(value as SocialPlatform);
}
