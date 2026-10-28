import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ReorderableList, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from 'react-native-reorderable-list';

import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_TITLE_MAX,
  type CollectionBookItem,
} from '@reading/shared';

import { BookRow } from '@/components/BookRow';
import {
  NEW_COLLECTION,
  useCollectionDraft,
} from '@/components/collections/CollectionDraftProvider';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useDeleteCollection, useSaveCollection } from '@/api/collections';
import { cn } from '@/lib/cn';
import { useColors } from '@/theme/ThemeProvider';

export default function CollectionFormScreen() {
  const { t } = useTranslation();
  const draft = useCollectionDraft();
  const save = useSaveCollection(draft.id);
  const canSave = draft.title.trim() !== '' && !save.isPending;

  function submit() {
    save.mutate(
      {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        bookIds: draft.books.map((book) => book.bookId),
      },
      // The first screen of the modal's stack: back closes the modal
      { onSuccess: () => router.back() },
    );
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-60"
            >
              <Text>{t('book.cancel')}</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={submit}
              disabled={!canSave}
              className={canSave ? 'active:opacity-60' : 'opacity-40'}
            >
              <Text className="font-sans-semibold text-accent">
                {t('collections.save')}
              </Text>
            </Pressable>
          ),
        }}
      />

      <ReorderableList
        data={draft.books}
        keyExtractor={(book) => book.bookId}
        // Lets rows know they're being dragged (useIsActive)
        shouldUpdateActiveItem
        onReorder={({ from, to }) =>
          draft.setBooks(reorderItems(draft.books, from, to))
        }
        renderItem={({ item }) => (
          <DraggableBookRow
            book={item}
            onRemove={() => draft.toggleBook(item)}
          />
        )}
        // 16 minus the rows' own px-2, so covers line up with the fields
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="gap-4 px-2 pb-3 pt-2">
            <TextField
              label={t('collections.titleLabel')}
              value={draft.title}
              onChangeText={draft.setTitle}
              placeholder={t('collections.titlePlaceholder')}
              maxLength={COLLECTION_TITLE_MAX}
            />

            <TextField
              label={t('collections.descriptionLabel')}
              value={draft.description}
              onChangeText={draft.setDescription}
              placeholder={t('collections.descriptionPlaceholder')}
              maxLength={COLLECTION_DESCRIPTION_MAX}
              multiline
              style={{ minHeight: 88, textAlignVertical: 'top' }}
            />

            {save.error ? (
              <Text className="text-danger">{save.error.message}</Text>
            ) : null}

            <View className="mt-2 gap-0.5">
              <Text variant="label">
                {t('collections.bookCount', { count: draft.books.length })}
              </Text>

              {draft.books.length > 1 ? (
                <Text variant="muted" className="text-xs">
                  {t('collections.dragHint')}
                </Text>
              ) : null}
            </View>
          </View>
        }
        ListFooterComponent={<FormFooter />}
      />
    </Screen>
  );
}

function DraggableBookRow({
  book,
  onRemove,
}: {
  book: CollectionBookItem;
  onRemove: () => void;
}) {
  const colors = useColors();

  const { t } = useTranslation();
  // Starts the drag; only works inside a ReorderableList row
  const drag = useReorderableDrag();
  // A background only while dragged: it moves over the other rows
  const isActive = useIsActive();

  return (
    <Pressable
      onLongPress={drag}
      delayLongPress={200}
      className={cn(
        'flex-row items-center gap-2 rounded-xl px-2',
        isActive && 'bg-card-strong',
      )}
    >
      <Feather name="menu" size={18} color={colors.fgFaint} />

      <View className="flex-1">
        <BookRow
          title={book.title}
          authors={book.authors}
          coverUrl={book.coverUrl}
          action={
            <Pressable
              onPress={onRemove}
              accessibilityLabel={t('collections.remove')}
              hitSlop={8}
              className="p-1 active:opacity-60"
            >
              <Feather name="x" size={18} color={colors.fgFaint} />
            </Pressable>
          }
        />
      </View>
    </Pressable>
  );
}

function FormFooter() {
  const { t } = useTranslation();
  const draft = useCollectionDraft();

  return (
    <View className="gap-4 px-2 pt-3">
      <Button
        title={t('collections.addBooks')}
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: '/collection-editor/[id]/books',
            params: { id: draft.id ?? NEW_COLLECTION },
          })
        }
      />

      {draft.id ? <DeleteCollection id={draft.id} /> : null}
    </View>
  );
}

function DeleteCollection({ id }: { id: string }) {
  const { t } = useTranslation();
  const remove = useDeleteCollection(id);

  function confirm() {
    Alert.alert(t('collections.deleteTitle'), t('collections.deleteMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('collections.delete'),
        style: 'destructive',
        // Back to the profile: the collection's own screen is gone too
        onPress: () =>
          remove.mutate(undefined, {
            onSuccess: () => router.dismissTo('/profile'),
          }),
      },
    ]);
  }

  return (
    <Pressable
      onPress={confirm}
      disabled={remove.isPending}
      className="items-center py-2 active:opacity-60"
    >
      <Text className="text-danger">{t('collections.delete')}</Text>
    </Pressable>
  );
}
