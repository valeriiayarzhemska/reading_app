import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { MyReading } from '@/components/stats/MyReading';
import { useTabBarInset } from '@/components/TabBar';
import { Screen } from '@/components/ui/Screen';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/SegmentedControl';

type ProfileView = 'profile' | 'reading';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const tabBarInset = useTabBarInset();
  const [view, setView] = useState<ProfileView>('profile');

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
        <SegmentedControl
          options={viewOptions}
          value={view}
          onChange={setView}
        />

        {view === 'profile' ? <ProfileOverview /> : <MyReading />}
      </ScrollView>
    </Screen>
  );
}
