import { Pressable, View } from 'react-native';

import { router } from 'expo-router';

import type { ReaderSummary } from '@reading/shared';

import { FollowButton } from '@/components/profile/FollowButton';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';

export function ReaderRow({ reader }: { reader: ReaderSummary }) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/user/[nickname]',
            params: { nickname: reader.nickname },
          })
        }
        className="flex-1 flex-row items-center gap-3 active:opacity-60"
      >
        <Avatar name={reader.displayName} url={reader.avatarUrl} size={44} />

        <View className="flex-1">
          <Text className="font-sans-semibold" numberOfLines={1}>
            {reader.displayName}
          </Text>

          <Text variant="muted" numberOfLines={1}>
            @{reader.nickname}
          </Text>
        </View>
      </Pressable>

      {reader.isMe ? null : (
        <FollowButton
          nickname={reader.nickname}
          isFollowing={reader.isFollowing}
        />
      )}
    </View>
  );
}
