import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  DatePrecision,
  dayWithBook,
  type FollowList,
  type PublicProfile,
} from '@reading/shared';

import { FavoritesRow } from '@/components/profile/FavoritesRow';
import { FollowButton } from '@/components/profile/FollowButton';
import { ProfileCollections } from '@/components/profile/ProfileCollections';
import { ProfileReviews } from '@/components/profile/ProfileReviews';
import { Avatar } from '@/components/ui/Avatar';
import { BookCover } from '@/components/ui/BookCover';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';

import { currentLanguage } from '@/i18n';
import { formatFinishDate } from '@/library/finishDate';
import { useColors } from '@/theme/ThemeProvider';

function displayLink(link: string): string {
  return link.replace(/^https:\/\/(www\.)?/, '');
}

// "9 Oct" for a known day; "≈ Sept 2021" / "≈ 2021" when only roughly known
function finishedLabel(iso: string, precision: DatePrecision): string {
  const language = currentLanguage();

  if (precision !== DatePrecision.DAY) {
    return formatFinishDate(iso, precision, language);
  }

  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

// Anyone's profile; your own has Edit instead of Follow
export function PublicProfileView({ profile }: { profile: PublicProfile }) {
  const colors = useColors();

  const { t } = useTranslation();
  const { currentlyReading: reading, stats } = profile;

  return (
    <View className="gap-6">
      <View className="flex-row items-start justify-between">
        <Avatar name={profile.displayName} url={profile.avatarUrl} />

        {profile.isMe ? (
          <Button
            title={t('profile.editProfile')}
            variant="secondary"
            onPress={() => router.push('/edit-profile')}
          />
        ) : (
          <FollowButton
            nickname={profile.nickname}
            isFollowing={profile.isFollowing}
          />
        )}
      </View>

      <View className="gap-1">
        <Text variant="title">{profile.displayName}</Text>

        <Text variant="muted">@{profile.nickname}</Text>

        <View className="mt-1 flex-row gap-4">
          <FollowCount
            nickname={profile.nickname}
            list="followers"
            label={t('follows.followersCount', {
              count: profile.followersCount,
            })}
          />

          <FollowCount
            nickname={profile.nickname}
            list="following"
            label={t('follows.followingCount', {
              count: profile.followingCount,
            })}
          />
        </View>

        {profile.bio ? <Text className="mt-2">{profile.bio}</Text> : null}

        {profile.links.map((link) => (
          <Pressable
            key={link}
            onPress={() => Linking.openURL(link)}
            accessibilityRole="link"
            className="mt-1 active:opacity-60"
          >
            <Text className="text-accent">{displayLink(link)}</Text>
          </Pressable>
        ))}
      </View>

      {reading ? (
        <Pressable
          // Only your own books open: someone else's shelf isn't yours to edit
          onPress={
            profile.isMe
              ? () =>
                  router.push({
                    pathname: '/book/[id]',
                    params: { id: reading.userBookId },
                  })
              : undefined
          }
          disabled={!profile.isMe}
          className="active:opacity-80"
        >
          <Card className="flex-row items-center gap-3">
            <BookCover uri={reading.coverUrl} title={reading.title} />

            <View className="flex-1 gap-1.5">
              <Text variant="label" className="text-accent">
                {reading.startedAt
                  ? t('profile.public.readingDay', {
                      day: dayWithBook(reading.startedAt),
                    })
                  : t('library.readingNow')}
              </Text>

              <Text className="font-serif" numberOfLines={2}>
                {reading.title}
              </Text>

              {reading.fraction !== null ? (
                <View className="flex-row items-center gap-2">
                  <ProgressBar value={reading.fraction} className="flex-1" />

                  <Text variant="muted" className="text-xs">
                    {Math.round(reading.fraction * 100)}%
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>
        </Pressable>
      ) : null}

      <View className="flex-row justify-between">
        <Figure
          value={String(stats.booksThisYear)}
          label={t('profile.public.booksInYear', { year: stats.year })}
        />

        <Figure
          value={String(stats.booksRead)}
          label={t('profile.public.total')}
        />

        <Figure
          value={
            stats.averageRating === null
              ? '—'
              : stats.averageRating.toLocaleString(currentLanguage())
          }
          label={t('profile.public.averageRating')}
        />
      </View>

      <FavoritesRow favorites={profile.favorites} isMe={profile.isMe} />

      <ProfileCollections
        collections={profile.collections}
        isMe={profile.isMe}
      />

      <ProfileReviews reviews={profile.reviews} count={profile.reviewsCount} />

      {profile.recentlyRead.length > 0 ? (
        <View className="gap-3">
          <Text variant="heading">{t('profile.public.recentlyRead')}</Text>

          {/* Negative margin + padding: the row scrolls edge to edge */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-4"
            contentContainerClassName="px-4"
          >
            {profile.recentlyRead.map((book) => (
              // Spacing as a plain style: neither a gap class on the content
              // container nor mr-3 took effect on these items
              <View
                key={book.userBookId}
                className="gap-1"
                style={{ width: 80, marginRight: 12 }}
              >
                <BookCover uri={book.coverUrl} title={book.title} size="md" />

                {book.rating !== null ? (
                  <View className="flex-row items-center gap-0.5">
                    <MaterialCommunityIcons
                      name="fire"
                      size={13}
                      color={colors.accent}
                    />

                    <Text className="font-sans-semibold text-xs">
                      {book.rating}/10
                    </Text>
                  </View>
                ) : null}

                <Text variant="muted" className="text-[11px]">
                  {finishedLabel(book.finishedAt, book.finishedPrecision)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function FollowCount({
  nickname,
  list,
  label,
}: {
  nickname: string;
  list: FollowList;
  label: string;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/follows/[nickname]',
          params: { nickname, list },
        })
      }
      accessibilityRole="link"
      className="active:opacity-60"
    >
      <Text className="text-sm text-fg-muted">{label}</Text>
    </Pressable>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text className="font-serif text-3xl">{value}</Text>

      <Text variant="label" className="text-center">
        {label}
      </Text>
    </View>
  );
}
