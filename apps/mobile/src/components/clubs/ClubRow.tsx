import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import type { ClubSummary } from '@reading/shared';

import { ClubAvatar } from '@/components/clubs/ClubAvatar';
import { BookCover } from '@/components/ui/BookCover';
import { Text } from '@/components/ui/Text';

import { cn } from '@/lib/cn';
import { useColors } from '@/theme/ThemeProvider';

interface ClubRowProps {
  club: ClubSummary;
  onPress: () => void;
  // My: rows inside one card, with the book's cover; All: a card per row
  variant: 'grouped' | 'card';
  isLast?: boolean;
}

export function ClubRow({ club, onPress, variant, isLast }: ClubRowProps) {
  const colors = useColors();

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
      <View>
        <ClubAvatar name={club.name} color={club.color} />

        {/* New messages since you last opened the chat */}
        {club.unreadCount > 0 ? (
          <View
            accessibilityLabel={t('clubs.unread', { count: club.unreadCount })}
            className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-background-top bg-accent"
          />
        ) : null}
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="font-serif text-lg" numberOfLines={1}>
          {club.name}
        </Text>

        <View className="flex-row items-center gap-1">
          <Feather name="users" size={13} color={colors.fgFaint} />

          <Text variant="muted" className="text-sm">
            {club.membersCount} ·
          </Text>

          {club.messagesToday > 0 ? (
            <Text className="text-sm text-accent">
              {t('clubs.perDay', { count: club.messagesToday })}
            </Text>
          ) : (
            <Text variant="muted" className="text-sm">
              {t('clubs.quiet')}
            </Text>
          )}
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
        <Feather name="chevron-right" size={18} color={colors.fgFaint} />
      ) : null}
    </Pressable>
  );
}
