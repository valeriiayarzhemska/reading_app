import { ActivityIndicator, ScrollView } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { PublicProfileView } from '@/components/profile/PublicProfileView';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { usePublicProfile } from '@/api/users';
import { COLORS } from '@/theme/colors';

// Anyone's profile: readingapp://user/alice
export default function UserProfileScreen() {
  const { nickname } = useLocalSearchParams<{ nickname: string }>();
  const { data, error } = usePublicProfile(nickname);

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
    <Screen>
      <ScrollView contentContainerClassName="px-4 pb-12 pt-2">
        <PublicProfileView profile={data} />
      </ScrollView>
    </Screen>
  );
}
