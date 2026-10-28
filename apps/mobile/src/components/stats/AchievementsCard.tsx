import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Achievement, AchievementCode } from '@reading/shared';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { useAchievements } from '@/api/achievements';
import { currentLanguage } from '@/i18n';
import { cn } from '@/lib/cn';

const ICONS: Record<AchievementCode, string> = {
  FIRST_BOOK: '📖',
  TEN_BOOKS: '📚',
  IN_ONE_SITTING: '⚡',
  MARATHON: '🏃',
  FOUR_A_DAY: '🔥',
  WEEK_STREAK: '📅',
};

export function AchievementsCard() {
  const { t } = useTranslation();
  const { data } = useAchievements();

  if (!data) {
    return null;
  }

  const earnedCount = data.filter((badge) => badge.earnedAt).length;

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text variant="heading">{t('achievements.title')}</Text>

        <Text variant="muted" className="text-sm">
          {t('achievements.count', { earned: earnedCount, total: data.length })}
        </Text>
      </View>

      <Card className="flex-row flex-wrap">
        {data.map((badge) => (
          <Badge key={badge.code} badge={badge} />
        ))}
      </Card>
    </View>
  );
}

function Badge({ badge }: { badge: Achievement }) {
  const { t } = useTranslation();
  const isEarned = badge.earnedAt !== null;
  const name = t(`achievements.${badge.code}.name`);

  // What it's for, and when you got it
  function explain() {
    const description = t(`achievements.${badge.code}.description`);
    const when = badge.earnedAt
      ? t('achievements.earnedOn', {
          date: new Intl.DateTimeFormat(currentLanguage(), {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(badge.earnedAt)),
        })
      : t('achievements.notYet');

    Alert.alert(name, `${description}\n\n${when}`);
  }

  return (
    <Pressable
      onPress={explain}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled: !isEarned }}
      className="items-center gap-1.5 py-3 active:opacity-70"
      style={{ width: '33.33%' }}
    >
      <View
        className={cn(
          'h-14 w-14 items-center justify-center rounded-full',
          isEarned ? 'bg-accent/25' : 'bg-card-strong opacity-40',
        )}
      >
        <Text className="text-2xl">{ICONS[badge.code]}</Text>
      </View>

      <Text
        className={cn(
          'px-1 text-center text-xs font-sans-semibold',
          !isEarned && 'text-fg-faint',
        )}
        numberOfLines={2}
      >
        {name}
      </Text>

      {badge.holdersPercent !== null ? (
        <Text variant="muted" className="text-[10px]">
          {t('achievements.holders', { percent: badge.holdersPercent })}
        </Text>
      ) : null}
    </Pressable>
  );
}
