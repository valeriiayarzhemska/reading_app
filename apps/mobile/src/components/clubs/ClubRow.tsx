import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import type { ClubSummary } from '@reading/shared';

import { ClubAvatar } from '@/components/clubs/ClubAvatar';
import { BookCover } from '@/components/ui/BookCover';
import { Text } from '@/components/ui/Text';

import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

interface ClubRowProps {
  club: ClubSummary;
  onPress: () => void;
  // My: rows inside one card, with the book's cover; All: a card per row
  variant: 'grouped' | 'card';
  isLast?: boolean;
}

export function ClubRow({ club, onPress, variant, isLast }: ClubRowProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-3 px-4 py-3.5 active:opacity-70',
        variant === 'grouped' && !isLast && 'border-b border-border',
        variant === 'card' && 'rounded-3xl border border-border bg-card',
      )}
    >
      <ClubAvatar name={club.name} color={club.color} />

      <View className="flex-1 gap-0.5">
        <Text className="font-serif text-lg" numberOfLines={1}>
          {club.name}
        </Text>

        <View className="flex-row items-center gap-1">
          <Feather name="users" size={13} color={COLORS.fgFaint} />

          {/* "34 a day" arrives with the chat; until then every club is quiet */}
          <Text variant="muted" className="text-sm">
            {club.membersCount} · {t('clubs.quiet')}
          </Text>
        </View>

        {club.book ? (
          <Text variant="muted" className="text-sm" numberOfLines={1}>
            {t('clubs.reading', { title: club.book.title })}
          </Text>
        ) : null}
      </View>

      {variant === 'grouped' && club.book ? (
        <BookCover uri={club.book.coverUrl} title={club.book.title} size="xs" />
      ) : null}

      {variant === 'card' ? (
        <Feather name="chevron-right" size={18} color={COLORS.fgFaint} />
      ) : null}
    </Pressable>
  );
}
