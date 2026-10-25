import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { POST_MAX_LENGTH, type UserBookWithBook } from '@reading/shared';

import { BookCover } from '@/components/ui/BookCover';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useCreatePost } from '@/api/posts';
import { useShelf } from '@/api/shelf';
import { pickPhoto } from '@/lib/pickPhoto';
import { sortForPicking } from '@/library/sortForPicking';
import { COLORS } from '@/theme/colors';

type Book = UserBookWithBook['book'];

export default function NewPostScreen() {
  const { t } = useTranslation();
  const create = useCreatePost();
  const shelf = useShelf();
  const [text, setText] = useState('');
  const [book, setBook] = useState<Book | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isPickingBook, setIsPickingBook] = useState(false);
  // As on the server: text, a photo, or both
  const canPost =
    (text.trim() !== '' || photoUri !== null) && !create.isPending;

  async function attachPhoto() {
    const uri = await pickPhoto();

    if (uri) {
      setPhotoUri(uri);
    }
  }

  function publish() {
    create.mutate(
      {
        text: text.trim(),
        bookId: book?.id,
        localPhotoUri: photoUri ?? undefined,
      },
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
              onPress={publish}
              disabled={!canPost}
              className={canPost ? 'active:opacity-60' : 'opacity-40'}
            >
              <Text className="font-sans-semibold text-accent">
                {create.isPending ? t('posts.posting') : t('posts.publish')}
              </Text>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerClassName="gap-4 px-4 pt-2 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('posts.placeholder')}
            placeholderTextColor={COLORS.fgFaint}
            selectionColor={COLORS.accent}
            keyboardAppearance="dark"
            multiline
            autoFocus
            maxLength={POST_MAX_LENGTH}
            className="min-h-32 font-sans text-base text-fg"
            style={{ textAlignVertical: 'top' }}
          />

          {book ? (
            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <BookCover uri={book.coverUrl} title={book.title} size="sm" />

              <View className="flex-1">
                <Text className="font-serif text-base" numberOfLines={2}>
                  {book.title}
                </Text>

                <Text variant="muted" className="text-xs" numberOfLines={1}>
                  {book.authors.join(', ')}
                </Text>
              </View>

              <RemoveButton
                label={t('posts.removeBook')}
                onPress={() => setBook(null)}
              />
            </View>
          ) : null}

          {photoUri ? (
            <View>
              <RemoteImage
                uri={photoUri}
                style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: 16 }}
              />

              <View className="absolute right-2 top-2">
                <RemoveButton
                  label={t('chat.removePhoto')}
                  onPress={() => setPhotoUri(null)}
                />
              </View>
            </View>
          ) : null}

          {create.error ? (
            <Text className="text-danger">{create.error.message}</Text>
          ) : null}
        </ScrollView>

        {isPickingBook && shelf.data ? (
          <View className="gap-2 border-t border-border pt-3">
            <Text variant="label" className="px-4">
              {t('posts.pickBook')}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4"
              keyboardShouldPersistTaps="handled"
            >
              {sortForPicking(shelf.data).map((entry) => (
                <Pressable
                  key={entry.bookId}
                  onPress={() => {
                    setBook(entry.book);
                    setIsPickingBook(false);
                  }}
                  accessibilityLabel={entry.book.title}
                  className="active:opacity-70"
                  // Plain margin: classes don't apply in a horizontal ScrollView
                  style={{ marginRight: 10 }}
                >
                  <BookCover
                    uri={entry.book.coverUrl}
                    title={entry.book.title}
                    size="sm"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="flex-row gap-5 border-t border-border px-4 py-3">
          <ToolButton
            icon="image"
            label={t('chat.attachPhoto')}
            onPress={attachPhoto}
          />

          <ToolButton
            icon="book-open"
            label={t('posts.attachBook')}
            onPress={() => setIsPickingBook((current) => !current)}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ToolButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="active:opacity-60"
    >
      <Feather name={icon} size={24} color={COLORS.fgMuted} />
    </Pressable>
  );
}

function RemoveButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="h-7 w-7 items-center justify-center rounded-full bg-card-strong active:opacity-70"
    >
      <Feather name="x" size={16} color={COLORS.fg} />
    </Pressable>
  );
}
