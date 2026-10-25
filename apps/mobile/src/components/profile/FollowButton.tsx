import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';

import { useToggleFollow } from '@/api/follows';

interface FollowButtonProps {
  nickname: string;
  isFollowing: boolean;
  className?: string;
}

// Filled "Follow" invites; the quiet "Following" is already done
export function FollowButton({
  nickname,
  isFollowing,
  className,
}: FollowButtonProps) {
  const { t } = useTranslation();
  const toggle = useToggleFollow();

  return (
    <Button
      title={t(isFollowing ? 'follows.following' : 'follows.follow')}
      variant={isFollowing ? 'secondary' : 'primary'}
      onPress={() => toggle.mutate({ nickname, follow: !isFollowing })}
      className={className}
    />
  );
}
