import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import type { ClubDetail } from '@reading/shared';

import { ClubAvatar } from '@/components/clubs/ClubAvatar';
import { Avatar } from '@/components/ui/Avatar';
import { BookCover } from '@/components/ui/BookCover';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useClub, useLeaveClub } from '@/api/clubs';
import { shareClub } from '@/clubs/shareClub';
import { currentLanguage } from '@/i18n';
import { COLORS } from '@/theme/colors';

// "About the room": readingapp://club-info/<id>
export default function ClubInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useClub(id);

  return (
    <Screen edges={['top', 'bottom']}>
      {data ? (
        <ClubInfo club={data} />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          {error ? (
            <Text className="text-center">{error.message}</Text>
          ) : (
            <ActivityIndicator color={COLORS.fg} />
          )}
        </View>
      )}
    </Screen>
  );
}

function ClubInfo({ club }: { club: ClubDetail }) {
  const { t } = useTranslation();
  const leave = useLeaveClub(club.id);

  function confirmLeave() {
    Alert.alert(t('clubs.info.leaveTitle'), t('clubs.info.leaveMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('clubs.info.leave'),
        style: 'destructive',
        // Back past the chat too: it's members-only now
        onPress: () =>
          leave.mutate(undefined, {
            onSuccess: () => router.dismissTo('/clubs'),
          }),
      },
    ]);
  }

  return (
    <ScrollView contentContainerClassName="gap-6 px-4 pb-10 pt-2">
      <View className="flex-row items-start gap-3">
        <IconButton
          icon="chevron-left"
          label={t('chat.back')}
          onPress={() => router.back()}
        />

        <View className="flex-1">
          <Text variant="label" numberOfLines={1}>
            {club.name}
          </Text>

          <Text variant="title">{t('clubs.info.title')}</Text>
        </View>

        <IconButton
          icon="share"
          label={t('clubs.info.share')}
          onPress={() => shareClub(club, t)}
        />
      </View>

      <Card className="flex-row items-center gap-4">
        <ClubAvatar name={club.name} color={club.color} size={64} />

        <View className="flex-1 gap-0.5">
          <Text variant="heading" numberOfLines={2}>
            {club.name}
          </Text>

          <Text variant="muted" className="text-sm">
            {t('clubs.members', { count: club.membersCount })}
          </Text>
        </View>
      </Card>

      {club.description ? (
        <Text variant="muted">{club.description}</Text>
      ) : null}

      <View className="gap-2">
        <Text variant="label">{t('clubs.info.host')}</Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/user/[nickname]',
              params: { nickname: club.host.nickname },
            })
          }
          className="active:opacity-70"
        >
          <Card className="flex-row items-center gap-3">
            <Avatar
              name={club.host.displayName}
              url={club.host.avatarUrl}
              size={44}
            />

            <View className="flex-1">
              <Text className="font-sans-semibold">
                {club.host.displayName}
              </Text>

              <Text variant="muted" className="text-sm">
                @{club.host.nickname}
              </Text>
            </View>

            <Feather name="chevron-right" size={18} color={COLORS.fgFaint} />
          </Card>
        </Pressable>
      </View>

      <ReadingTogetherCard club={club} />

      <Text variant="muted" className="text-sm">
        {t('clubs.info.created', {
          date: new Intl.DateTimeFormat(currentLanguage(), {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(club.createdAt)),
        })}
      </Text>

      {club.isHost ? (
        <Text variant="muted" className="text-center text-sm">
          {t('clubs.info.youHost')}
        </Text>
      ) : (
        <Button
          title={t('clubs.info.leave')}
          variant="secondary"
          loading={leave.isPending}
          onPress={confirmLeave}
        />
      )}

      {leave.error ? (
        <Text className="text-center text-danger">{leave.error.message}</Text>
      ) : null}
    </ScrollView>
  );
}

// The host picks or changes the book; members just see it
function ReadingTogetherCard({ club }: { club: ClubDetail }) {
  const { t } = useTranslation();

  if (!club.book && !club.isHost) {
    return null;
  }

  function choose() {
    router.push({ pathname: '/club-book/[id]', params: { id: club.id } });
  }

  return (
    <View className="gap-2">
      <Text variant="label">{t('clubs.readingTogether')}</Text>

      {club.book ? (
        <Card className="flex-row items-center gap-3">
          <BookCover uri={club.book.coverUrl} title={club.book.title} />

          <View className="flex-1 gap-0.5">
            <Text className="font-serif text-base" numberOfLines={2}>
              {club.book.title}
            </Text>

            <Text variant="muted" className="text-xs" numberOfLines={1}>
              {club.book.authors.join(', ')}
            </Text>
          </View>

          {club.isHost ? (
            <Pressable onPress={choose} className="active:opacity-60">
              <Text variant="label" className="text-accent">
                {t('clubs.info.change')}
              </Text>
            </Pressable>
          ) : null}
        </Card>
      ) : (
        <Button
          title={t('clubs.info.chooseBook')}
          variant="secondary"
          onPress={choose}
        />
      )}
    </View>
  );
}
