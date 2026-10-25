import { useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { REVIEW_MAX_LENGTH, type UserBookWithBook } from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useDeleteReview, useSaveReview } from '@/api/reviews';
import { COLORS } from '@/theme/colors';

interface ReviewSheetProps {
  entry: UserBookWithBook;
  open: boolean;
  onClose: () => void;
}

export function ReviewSheet({ entry, open, onClose }: ReviewSheetProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(entry.review?.text ?? '');
  const [hasSpoilers, setHasSpoilers] = useState(
    entry.review?.hasSpoilers ?? false,
  );
  const [wasOpen, setWasOpen] = useState(open);
  const save = useSaveReview(entry);
  const remove = useDeleteReview(entry);

  // Refill on every open: a closed sheet keeps the last unsaved draft
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setText(entry.review?.text ?? '');
      setHasSpoilers(entry.review?.hasSpoilers ?? false);
    }
  }

  function confirmDelete() {
    Alert.alert(t('reviews.deleteTitle'), t('reviews.deleteMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('reviews.delete'),
        style: 'destructive',
        onPress: () => remove.mutate(undefined, { onSuccess: onClose }),
      },
    ]);
  }

  const error = save.error ?? remove.error;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t(entry.review ? 'reviews.editTitle' : 'reviews.writeTitle')}
      subtitle={entry.book.title}
    >
      <View className="gap-1.5">
        <TextField
          inSheet
          value={text}
          onChangeText={setText}
          placeholder={t('reviews.placeholder')}
          multiline
          maxLength={REVIEW_MAX_LENGTH}
          // Multiline inputs grow with the text; keep a few lines visible
          style={{ minHeight: 140, maxHeight: 260, textAlignVertical: 'top' }}
        />

        <Text variant="muted" className="text-right text-xs">
          {text.length} / {REVIEW_MAX_LENGTH}
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-0.5">
          <Text className="font-sans-semibold">{t('reviews.spoilers')}</Text>

          <Text variant="muted" className="text-xs">
            {t('reviews.spoilersHint')}
          </Text>
        </View>

        <Switch
          value={hasSpoilers}
          onValueChange={setHasSpoilers}
          trackColor={{ true: COLORS.accent, false: COLORS.cardStrong }}
          thumbColor={COLORS.fg}
        />
      </View>

      {error ? (
        <Text className="text-center text-danger">{error.message}</Text>
      ) : null}

      <Button
        title={t('reviews.save')}
        disabled={text.trim() === ''}
        loading={save.isPending}
        onPress={() =>
          save.mutate(
            { text: text.trim(), hasSpoilers },
            { onSuccess: onClose },
          )
        }
      />

      {entry.review ? (
        <Pressable
          onPress={confirmDelete}
          disabled={remove.isPending}
          className="items-center py-1 active:opacity-60"
        >
          <Text className="text-danger">{t('reviews.delete')}</Text>
        </Pressable>
      ) : null}
    </Sheet>
  );
}
