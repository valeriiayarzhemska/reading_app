import { useTranslation } from 'react-i18next';

import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Declaration order = tab order: Library is `index` but sits second */}
      <Tabs.Screen name="feed" options={{ title: t('tabs.feed') }} />

      <Tabs.Screen name="index" options={{ title: t('tabs.library') }} />

      <Tabs.Screen name="clubs" options={{ title: t('tabs.clubs') }} />

      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
