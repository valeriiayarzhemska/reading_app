import { Tabs } from 'expo-router';
import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Declaration order = tab order: Library is `index` but sits in the middle */}
      <Tabs.Screen name="feed" options={{ title: 'Shelves' }} />

      <Tabs.Screen name="index" options={{ title: 'Library' }} />

      <Tabs.Screen name="clubs" options={{ title: 'Clubs' }} />

      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
