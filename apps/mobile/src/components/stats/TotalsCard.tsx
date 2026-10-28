import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { StatsSummary } from '@reading/shared';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { currentLanguage } from '@/i18n';
import { formatCount } from '@/lib/format';
import { useColors } from '@/theme/ThemeProvider';

export function TotalsCard({ stats }: { stats: StatsSummary }) {
  const colors = useColors();

  const { t } = useTranslation();
  const language = currentLanguage();
  const { total, year } = stats;

  return (
    <Card className="gap-4">
      <View className="h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent/15">
        <MaterialCommunityIcons name="fire" size={22} color={colors.accent} />
      </View>

      <View className="gap-1">
        <Text className="font-serif text-4xl text-fg">
          {t('stats.hours', { count: Math.round(total.minutes / 60) })}
        </Text>

        <Text variant="muted">
          {t('stats.totalLine', {
            books: t('stats.books', { count: total.booksRead }),
            pages: t('stats.pagesShort', {
              value: formatCount(total.pages, language, t),
            }),
          })}
        </Text>
      </View>

      <View className="flex-row gap-6">
        <Figure
          value={String(year.booksRead)}
          label={t('stats.booksInYear', { year: year.year })}
        />

        {total.averageRating !== null ? (
          <Figure
            value={total.averageRating.toLocaleString(language)}
            label={t('stats.averageRating')}
          />
        ) : null}
      </View>
    </Card>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <View className="gap-0.5">
      <Text className="font-serif text-2xl">{value}</Text>

      <Text variant="label">{label}</Text>
    </View>
  );
}
