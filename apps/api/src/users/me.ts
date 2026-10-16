import type { Me } from '@reading/shared';

export const ME_SELECT = {
  id: true,
  email: true,
  nickname: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  links: true,
  timezone: true,
  onboardedAt: true,
} as const;

interface MeRow extends Omit<Me, 'onboardedAt'> {
  onboardedAt: Date | null;
}

// Dates go over JSON as ISO strings; the shared Me type says so explicitly
export function toMe(user: MeRow): Me {
  return { ...user, onboardedAt: user.onboardedAt?.toISOString() ?? null };
}
