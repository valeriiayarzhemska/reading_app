import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { useTabBarInset } from '@/components/tab-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';

import { useAuth } from '@/auth/auth-context';
import { currentLanguage, setLanguage, type Language } from '@/i18n';

// Each language is shown in its own language, so it's findable whatever is active
const LANGUAGE_OPTIONS: SegmentOption<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
];

// "https://www.instagram.com/vale.arw" → "instagram.com/vale.arw"
function displayLink(link: string): string {
  return link.replace(/^https:\/\/(www\.)?/, '');
}

export default function ProfileScreen() {
  // Re-renders this screen when the language changes
  const { t } = useTranslation();
  const { state, signOut } = useAuth();
  const tabBarInset = useTabBarInset();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = state.status === 'signedIn' ? state.user : null;

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
  }

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-6 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: tabBarInset }}
      >
        <Text variant="title">{t('tabs.profile')}</Text>

        {user ? (
          <Card className="gap-3">
            <View>
              <Text variant="heading">{user.displayName}</Text>

              <Text variant="muted">@{user.nickname}</Text>
            </View>

            {user.bio ? <Text>{user.bio}</Text> : null}

            {user.links.map((link) => (
              <Pressable key={link} onPress={() => Linking.openURL(link)}>
                <Text className="text-accent">{displayLink(link)}</Text>
              </Pressable>
            ))}

            <Button
              title={t('profile.editProfile')}
              variant="secondary"
              onPress={() => router.push('/edit-profile')}
              className="mt-1"
            />
          </Card>
        ) : null}

        <View className="gap-2">
          <Text variant="label">{t('profile.language')}</Text>

          <SegmentedControl
            options={LANGUAGE_OPTIONS}
            value={currentLanguage()}
            onChange={setLanguage}
          />
        </View>

        <View className="gap-3">
          {__DEV__ ? (
            <Button
              title="Design system"
              variant="secondary"
              onPress={() => router.push('/design')}
            />
          ) : null}

          <Button
            title={t('profile.signOut')}
            variant="secondary"
            loading={isSigningOut}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
