import { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import { bookMatchKey, type BookSearchResult } from '@reading/shared';

import { BookRow } from '@/components/BookRow';
import { ReaderRow } from '@/components/profile/ReaderRow';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { resultKey, savedBookKeys, useBookSearch } from '@/api/books';
import { ApiError } from '@/api/client';
import { useReaderSearch } from '@/api/follows';
import { useAddToShelf, useShelf } from '@/api/shelf';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { COLORS } from '@/theme/colors';

type SearchMode = 'books' | 'readers';

export default function SearchScreen() {
  const { t } = useTranslation();
  // ?mode=readers: opened from Shelves to find people
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<SearchMode>(
    params.mode === 'readers' ? 'readers' : 'books',
  );
  // One text for both tabs: switching keeps what you typed
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 400);

  return (
    <Screen className="px-4 pt-2">
      <SegmentedControl
        options={[
          { value: 'books', label: t('search.modes.books') },
          { value: 'readers', label: t('search.modes.readers') },
        ]}
        value={mode}
        onChange={setMode}
        className="mb-3"
      />

      <TextField
        placeholder={t(
          mode === 'books' ? 'search.placeholder' : 'search.readersPlaceholder',
        )}
        value={text}
        onChangeText={setText}
        autoFocus
        autoCorrect={false}
        autoCapitalize={mode === 'readers' ? 'none' : 'sentences'}
        clearButtonMode="while-editing"
      />

      {mode === 'books' ? (
        <BookResults query={query} />
      ) : (
        <ReaderResults query={query} />
      )}
    </Screen>
  );
}

function ReaderResults({ query }: { query: string }) {
  const { t } = useTranslation();
  const search = useReaderSearch(query);

  return (
    <>
      {search.isFetching ? (
        <ActivityIndicator className="mt-3" color={COLORS.fg} />
      ) : null}

      {search.error ? (
        <Text className="mt-2 text-danger">
          {t('search.failed', { message: search.error.message })}
        </Text>
      ) : null}

      <FlashList
        data={search.data ?? []}
        keyExtractor={(reader) => reader.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        ListEmptyComponent={
          query.length >= 2 && search.isSuccess ? (
            <Text variant="muted" className="mt-4 text-center">
              {t('search.noReaders')}
            </Text>
          ) : null
        }
        renderItem={({ item }) => <ReaderRow reader={item} />}
      />
    </>
  );
}

function BookResults({ query }: { query: string }) {
  const { t } = useTranslation();
  const search = useBookSearch(query);
  const shelf = useShelf();
  const addToShelf = useAddToShelf();

  // Title + author too: the same book may be saved from the other source
  const shelfIds = new Set(
    shelf.data?.flatMap((userBook) => savedBookKeys(userBook.book)),
  );
  const shelfTitles = new Set(
    shelf.data?.map(({ book }) => bookMatchKey(book.title, book.authors)),
  );

  function isOnShelf(result: BookSearchResult): boolean {
    return (
      shelfIds.has(resultKey(result)) ||
      shelfTitles.has(bookMatchKey(result.title, result.authors))
    );
  }

  function renderAction(result: BookSearchResult) {
    if (isOnShelf(result)) {
      return (
        <Text className="font-sans-semibold text-sm text-accent">
          {t('search.onShelf')}
        </Text>
      );
    }

    const isAdding =
      addToShelf.isPending &&
      addToShelf.variables !== undefined &&
      resultKey(addToShelf.variables) === resultKey(result);

    return (
      <Pressable
        disabled={addToShelf.isPending}
        onPress={() => addToShelf.mutate(result)}
        className="rounded-full bg-card-strong px-4 py-2 active:opacity-70 disabled:opacity-50"
      >
        <Text className="font-sans-semibold text-sm">
          {isAdding ? t('search.adding') : t('search.add')}
        </Text>
      </Pressable>
    );
  }

  return (
    <>
      {addToShelf.error ? (
        <Text className="mt-2 text-danger">
          {addToShelf.error instanceof ApiError &&
          addToShelf.error.status === 409
            ? t('search.alreadyOnShelf')
            : addToShelf.error.message}
        </Text>
      ) : null}

      {search.isFetching ? (
        <ActivityIndicator className="mt-3" color={COLORS.fg} />
      ) : null}

      {search.error ? (
        <Text className="mt-2 text-danger">
          {t('search.failed', { message: search.error.message })}
        </Text>
      ) : null}

      <FlashList
        data={search.data ?? []}
        keyExtractor={resultKey}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        ListEmptyComponent={
          query.length >= 2 && search.isSuccess ? (
            <Text variant="muted" className="mt-4 text-center">
              {t('search.nothingFound')}
            </Text>
          ) : null
        }
        ListFooterComponent={
          query.length >= 2 && search.isSuccess ? (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/add-book', params: { query } })
              }
              className="mt-4 items-center gap-1 py-3 active:opacity-60"
            >
              <Text variant="muted">{t('search.cantFind')}</Text>

              <Text className="font-sans-semibold text-accent">
                {t('search.addManually')}
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <BookRow
            title={item.title}
            authors={item.authors}
            coverUrl={item.coverUrl}
            subtitle={
              item.pageCount
                ? t('search.pageCount', { count: item.pageCount })
                : undefined
            }
            action={renderAction(item)}
          />
        )}
      />
    </>
  );
}
