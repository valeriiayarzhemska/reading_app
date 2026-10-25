import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ClubSummary } from '@reading/shared';

import { ClubAvatar } from '@/components/clubs/ClubAvatar';
import { BookCover } from '@/components/ui/BookCover';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

import { useClub, useJoinClub } from '@/api/clubs';

interface JoinClubSheetProps {
  // The last row tapped in All. Kept after closing, so the content doesn't
  // vanish while the sheet slides down.
  club: ClubSummary | null;
  open: boolean;
  onClose: () => void;
  onJoined: (club: ClubSummary) => void;
}

export function JoinClubSheet({
  club,
  open,
  onClose,
  onJoined,
}: JoinClubSheetProps) {
  return (
    <Sheet open={open} onClose={onClose}>
      {club ? <JoinClubContent club={club} onJoined={onJoined} /> : null}
    </Sheet>
  );
}

function JoinClubContent({
  club,
  onJoined,
}: {
  club: ClubSummary;
  onJoined: (club: ClubSummary) => void;
}) {
  const { t } = useTranslation();
  // The list row has no description: it comes with the details
  const { data: detail } = useClub(club.id);
  const join = useJoinClub(club.id);

  return (
    <>
      <View className="flex-row items-center gap-4">
        <ClubAvatar name={club.name} color={club.color} size={64} />

        <View className="flex-1 gap-0.5">
          <Text variant="heading" className="text-2xl" numberOfLines={2}>
            {club.name}
          </Text>

          <Text variant="muted" className="text-sm">
            @{club.host.nickname} ·{' '}
            {t('clubs.members', { count: club.membersCount })}
          </Text>
        </View>
      </View>

      {detail?.description ? <Text>{detail.description}</Text> : null}

      <View className="flex-row justify-between border-y border-border py-3">
        <Text variant="muted">{t('clubs.entry')}</Text>

        <Text>{t('clubs.entryOpen')}</Text>
      </View>

      {club.book ? (
        <Card className="flex-row items-center gap-3">
          <BookCover uri={club.book.coverUrl} title={club.book.title} />

          <View className="flex-1 gap-0.5">
            <Text variant="label">{t('clubs.readingTogether')}</Text>

            <Text className="font-serif text-base" numberOfLines={2}>
              {club.book.title}
            </Text>

            <Text variant="muted" className="text-xs" numberOfLines={1}>
              {club.book.authors.join(', ')}
              {club.book.pageCount
                ? ` · ${t('search.pageCount', { count: club.book.pageCount })}`
                : ''}
            </Text>
          </View>
        </Card>
      ) : null}

      {join.error ? (
        <Text className="text-center text-danger">{join.error.message}</Text>
      ) : null}

      <Button
        title={t('clubs.join')}
        loading={join.isPending}
        onPress={() =>
          join.mutate(undefined, { onSuccess: () => onJoined(club) })
        }
      />
    </>
  );
}
