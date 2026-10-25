import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import type { ClubSummary } from '@reading/shared';

import { ClubRow } from '@/components/clubs/ClubRow';
import { CreateClubSheet } from '@/components/clubs/CreateClubSheet';
import { JoinClubSheet } from '@/components/clubs/JoinClubSheet';
import { ReadingTogether } from '@/components/clubs/ReadingTogether';
import { useTabBarInset } from '@/components/TabBar';
import { Chips } from '@/components/ui/Chips';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useAllClubs, useMyClubs } from '@/api/clubs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { COLORS } from '@/theme/colors';

type ClubsView = 'mine' | 'all';

function openClub(id: string) {
  router.push({ pathname: '/clubs/[id]', params: { id } });
}

export default function ClubsScreen() {
  const { t } = useTranslation();
  const tabBarInset = useTabBarInset();
  const [view, setView] = useState<ClubsView>('mine');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-6 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: tabBarInset }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-2">
          <Text variant="title" className="flex-1">
            {t('clubs.title')}
          </Text>

          <Chips
            options={[
              { value: 'mine', label: t('clubs.mine') },
              { value: 'all', label: t('clubs.all') },
            ]}
            value={view}
            onChange={setView}
          />

          {view === 'mine' ? (
            <Pressable
              onPress={() => setIsCreateOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('clubs.create.title')}
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
            >
              <Feather name="plus" size={20} color={COLORS.fg} />
            </Pressable>
          ) : null}
        </View>

        {view === 'mine' ? <MyClubs /> : <AllClubs />}
      </ScrollView>

      <CreateClubSheet
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(club) => {
          setIsCreateOpen(false);
          openClub(club.id);
        }}
      />
    </Screen>
  );
}

function MyClubs() {
  const { t } = useTranslation();
  const { data, error } = useMyClubs();

  if (!data) {
    return error ? (
      <Text className="text-center">{error.message}</Text>
    ) : (
      <ActivityIndicator color={COLORS.fg} />
    );
  }

  if (data.length === 0) {
    return (
      <Text variant="muted" className="text-center">
        {t('clubs.emptyMine')}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      <Text variant="label">{t('clubs.memberOf', { count: data.length })}</Text>

      <View className="overflow-hidden rounded-3xl border border-border bg-card">
        {data.map((club, index) => (
          <ClubRow
            key={club.id}
            club={club}
            variant="grouped"
            isLast={index === data.length - 1}
            onPress={() => openClub(club.id)}
          />
        ))}
      </View>
    </View>
  );
}

function AllClubs() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 400);
  const { data, error } = useAllClubs(query);
  const [selected, setSelected] = useState<ClubSummary | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Members go straight in; everyone else sees the join sheet first
  function open(club: ClubSummary) {
    if (club.isMember) {
      openClub(club.id);

      return;
    }

    setSelected(club);
    setIsJoinOpen(true);
  }

  const clubs = data ?? [];

  return (
    <>
      {/* Search results don't change the carousel: it shows every club
          reading something, from the unfiltered list */}
      {query === '' ? (
        <ReadingTogether
          clubs={clubs.filter((club) => club.book !== null)}
          onOpen={open}
        />
      ) : null}

      <View className="gap-3">
        <Text variant="title" className="text-2xl">
          {t('clubs.rooms')}
        </Text>

        <TextField
          value={text}
          onChangeText={setText}
          placeholder={t('clubs.searchPlaceholder')}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {error ? <Text className="text-danger">{error.message}</Text> : null}

        {!data && !error ? <ActivityIndicator color={COLORS.fg} /> : null}

        {data && clubs.length === 0 ? (
          <Text variant="muted" className="text-center">
            {t('clubs.nothingFound')}
          </Text>
        ) : null}

        {clubs.map((club) => (
          <ClubRow
            key={club.id}
            club={club}
            variant="card"
            onPress={() => open(club)}
          />
        ))}
      </View>

      <JoinClubSheet
        club={selected}
        open={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={(club) => {
          setIsJoinOpen(false);
          openClub(club.id);
        }}
      />
    </>
  );
}
