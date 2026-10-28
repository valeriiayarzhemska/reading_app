import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { ReadingSettingsSection } from '@/components/settings/ReadingSettingsSection';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';

import { useAuth } from '@/auth/AuthContext';
import { currentLanguage, setLanguage, type Language } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

// Each language is shown in its own language, so it's findable whatever is active
const LANGUAGE_OPTIONS: SegmentOption<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
];

export default function SettingsScreen() {
  // Re-renders when the language changes
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-6 px-4 pb-12 pt-2">
        <View className="gap-2">
          <Text variant="label">{t('profile.language')}</Text>

          <SegmentedControl
            options={LANGUAGE_OPTIONS}
            value={currentLanguage()}
            onChange={setLanguage}
          />
        </View>

        <View className="gap-2">
          <Text variant="label">{t('settings.appearance')}</Text>

          <SegmentedControl
            options={[
              { value: 'system', label: t('settings.themes.system') },
              { value: 'light', label: t('settings.themes.light') },
              { value: 'dark', label: t('settings.themes.dark') },
            ]}
            value={preference}
            onChange={setPreference}
          />
        </View>

        <ReadingSettingsSection />

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
