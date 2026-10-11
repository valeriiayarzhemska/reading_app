import type { BookSearchResult } from '@reading/shared';
import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBookSearch } from '@/api/books';
import { ApiError } from '@/api/client';
import { useAddToShelf, useShelf } from '@/api/shelf';
import { BookRow } from '@/components/book-row';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export default function SearchScreen() {
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 400);
  const search = useBookSearch(query);
  const shelf = useShelf();
  const addToShelf = useAddToShelf();

  // Google IDs already on my shelf → show "On shelf ✓" instead of "Add"
  const onShelf = new Set(
    shelf.data?.map((userBook) => userBook.book.googleBooksId),
  );

  function renderAction(result: BookSearchResult) {
    if (onShelf.has(result.googleBooksId)) {
      return <Text style={styles.onShelf}>On shelf ✓</Text>;
    }

    const isAdding =
      addToShelf.isPending &&
      addToShelf.variables?.googleBooksId === result.googleBooksId;

    return (
      <Button
        title={isAdding ? 'Adding…' : 'Add'}
        disabled={addToShelf.isPending}
        onPress={() => addToShelf.mutate(result)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.input}
        placeholder="Title or author"
        value={text}
        onChangeText={setText}
        autoFocus
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {addToShelf.error ? (
        <Text style={styles.error}>
          {addToShelf.error instanceof ApiError &&
          addToShelf.error.status === 409
            ? 'This book is already on your shelf'
            : addToShelf.error.message}
        </Text>
      ) : null}

      {search.isFetching ? <ActivityIndicator style={styles.loader} /> : null}

      {search.error ? (
        <Text style={styles.error}>Search failed: {search.error.message}</Text>
      ) : null}

      <FlatList
        data={search.data ?? []}
        keyExtractor={(result) => result.googleBooksId}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.length >= 2 && search.isSuccess ? (
            <Text style={styles.hint}>Nothing found</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  loader: {
    marginTop: 12,
  },
  error: {
    color: '#c00',
    marginTop: 8,
  },
  hint: {
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  onShelf: {
    color: '#2a2',
  },
});
