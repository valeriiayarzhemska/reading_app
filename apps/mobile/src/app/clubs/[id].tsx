import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Stack, useLocalSearchParams } from 'expo-router';

import { ClubAvatar } from '@/components/clubs/ClubAvatar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useClub } from '@/api/clubs';
import { COLORS } from '@/theme/colors';

// The club's chat (CLB-2). For now: who's here and what's next.
export default function ClubScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useClub(id);

  if (!data) {
    return (
      <Screen className="items-center justify-center px-6">
        {error ? (
          <Text className="text-center">{error.message}</Text>
        ) : (
          <ActivityIndicator color={COLORS.fg} />
        )}
      </Screen>
    );
  }

  return (
    <Screen className="items-center justify-center gap-3 px-6">
      <Stack.Screen options={{ title: data.name }} />

      <ClubAvatar name={data.name} color={data.color} size={72} />

      <Text variant="heading" className="text-center">
        {data.name}
      </Text>

      <Text variant="muted">
        {t('clubs.members', { count: data.membersCount })}
      </Text>

      <View className="mt-4">
        <Text variant="muted" className="text-center">
          {t('clubs.chatSoon')}
        </Text>
      </View>
    </Screen>
  );
}
