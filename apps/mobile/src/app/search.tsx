import { bookMatchKey, type BookSearchResult } from '@reading/shared';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable } from 'react-native';
import { resultKey, savedBookKeys, useBookSearch } from '@/api/books';
import { ApiError } from '@/api/client';
import { useAddToShelf, useShelf } from '@/api/shelf';
import { BookRow } from '@/components/book-row';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { COLORS } from '@/theme/colors';

export default function SearchScreen() {
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 400);
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
          On shelf ✓
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
          {isAdding ? 'Adding…' : '+ Add'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Screen className="px-4 pt-2">
      <TextField
        placeholder="Title or author"
        value={text}
        onChangeText={setText}
        autoFocus
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {addToShelf.error ? (
        <Text className="mt-2 text-danger">
          {addToShelf.error instanceof ApiError &&
          addToShelf.error.status === 409
            ? 'This book is already on your shelf'
            : addToShelf.error.message}
        </Text>
      ) : null}

      {search.isFetching ? (
        <ActivityIndicator className="mt-3" color={COLORS.fg} />
      ) : null}

      {search.error ? (
        <Text className="mt-2 text-danger">
          Search failed: {search.error.message}
        </Text>
      ) : null}

      <FlatList
        data={search.data ?? []}
        keyExtractor={resultKey}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-8 pt-2"
        ListEmptyComponent={
          query.length >= 2 && search.isSuccess ? (
            <Text variant="muted" className="mt-4 text-center">
              Nothing found
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <BookRow
            title={item.title}
            authors={item.authors}
            coverUrl={item.coverUrl}
            subtitle={item.pageCount ? `${item.pageCount} pages` : undefined}
            action={renderAction(item)}
          />
        )}
      />
    </Screen>
  );
}
