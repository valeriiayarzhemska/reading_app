import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';

import { currentLanguage } from '@/i18n';
import { COLORS } from '@/theme/colors';

interface RatingSummaryProps {
  ratingAvg: number | null;
  ratingCount: number;
}

// "🔥 8.4 · 12 ratings" over all readers, or "No ratings yet"
export function RatingSummary({ ratingAvg, ratingCount }: RatingSummaryProps) {
  const { t } = useTranslation();

  if (ratingAvg === null) {
    return (
      <Text variant="muted" className="text-sm">
        {t('reviews.noRatings')}
      </Text>
    );
  }

  return (
    <View className="flex-row items-center gap-1">
      <MaterialCommunityIcons name="fire" size={16} color={COLORS.accent} />

      <Text className="font-sans-semibold">
        {ratingAvg.toLocaleString(currentLanguage(), {
          maximumFractionDigits: 1,
        })}
      </Text>

      <Text variant="muted" className="text-sm">
        · {t('reviews.ratingCount', { count: ratingCount })}
      </Text>
    </View>
  );
}
