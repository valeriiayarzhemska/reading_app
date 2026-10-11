import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ComingSoon } from '@/components/coming-soon';
import { Button } from '@/components/ui/button';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { currentLanguage, setLanguage, type Language } from '@/i18n';

// Each language is shown in its own language, so it's findable whatever is active
const LANGUAGE_OPTIONS: SegmentOption<Language>[] = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
];

export default function ProfileScreen() {
  // Re-renders this screen when the language changes
  const { t } = useTranslation();

  return (
    <ComingSoon
      title={t('tabs.profile')}
      description={t('placeholders.profile')}
    >
      <View className="mt-8 gap-2 self-stretch">
        <Text variant="label">{t('profile.language')}</Text>

        <SegmentedControl
          options={LANGUAGE_OPTIONS}
          value={currentLanguage()}
          onChange={setLanguage}
        />
      </View>

      {__DEV__ ? (
        <Button
          title="Design system"
          variant="secondary"
          onPress={() => router.push('/design')}
          className="mt-6 self-stretch"
        />
      ) : null}
    </ComingSoon>
  );
}
