import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { PublicProfileView } from '@/components/profile/PublicProfileView';
import { MyReading } from '@/components/stats/MyReading';
import { useTabBarInset } from '@/components/TabBar';
import { Screen } from '@/components/ui/Screen';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';

import { usePublicProfile } from '@/api/users';
import { useAuth } from '@/auth/AuthContext';
import { useColors } from '@/theme/ThemeProvider';

type ProfileView = 'profile' | 'reading';

export default function ProfileScreen() {
  const colors = useColors();

  const { t } = useTranslation();
  const tabBarInset = useTabBarInset();
  const [view, setView] = useState<ProfileView>('profile');
  const { state } = useAuth();
  // The tabs are reachable only when signed in
  const nickname = state.status === 'signedIn' ? state.user.nickname : '';

  const viewOptions: SegmentOption<ProfileView>[] = [
    { value: 'profile', label: t('profile.views.profile') },
    { value: 'reading', label: t('profile.views.reading') },
  ];

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-6 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: tabBarInset }}
      >
        <View className="flex-row items-center gap-3">
          <SegmentedControl
            options={viewOptions}
            value={view}
            onChange={setView}
            className="flex-1"
          />

          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
          >
            <Feather name="settings" size={20} color={colors.fg} />
          </Pressable>
        </View>

        {view === 'profile' ? (
          <OwnProfile nickname={nickname} />
        ) : (
          <MyReading />
        )}
      </ScrollView>
    </Screen>
  );
}

// Your profile as others see it (with Edit)
function OwnProfile({ nickname }: { nickname: string }) {
  const colors = useColors();

  const { data, error } = usePublicProfile(nickname);

  if (error) {
    return (
      <Text variant="muted" className="text-center">
        {error.message}
      </Text>
    );
  }

  if (!data) {
    return <ActivityIndicator className="py-8" color={colors.fg} />;
  }

  return <PublicProfileView profile={data} />;
}
