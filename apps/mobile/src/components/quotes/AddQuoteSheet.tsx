import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  ProgressUnit,
  QUOTE_MAX_LENGTH,
  QUOTE_PAGE_MAX,
  type UserBookWithBook,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useAddQuote } from '@/api/quotes';

interface AddQuoteSheetProps {
  entry: UserBookWithBook;
  open: boolean;
  onClose: () => void;
}

// The page you're on: usually where the quote came from
function currentPage(entry: UserBookWithBook): string {
  return entry.progressUnit === ProgressUnit.PAGES && entry.currentProgress > 0
    ? String(entry.currentProgress)
    : '';
}

export function AddQuoteSheet({ entry, open, onClose }: AddQuoteSheetProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [page, setPage] = useState(currentPage(entry));
  const [wasOpen, setWasOpen] = useState(open);
  const add = useAddQuote(entry.id);

  // Every open starts a new quote
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setText('');
      setPage(currentPage(entry));
      add.reset();
    }
  }

  const pageNumber = Number(page);
  const isPageValid =
    page.trim() === '' ||
    (Number.isInteger(pageNumber) &&
      pageNumber >= 1 &&
      pageNumber <= QUOTE_PAGE_MAX);

  function save() {
    add.mutate(
      {
        text: text.trim(),
        page: page.trim() === '' ? undefined : pageNumber,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('quotes.addTitle')}
      subtitle={entry.book.title}
    >
      <View className="gap-1.5">
        <TextField
          inSheet
          value={text}
          onChangeText={setText}
          placeholder={t('quotes.placeholder')}
          multiline
          maxLength={QUOTE_MAX_LENGTH}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />

        <Text variant="muted" className="text-right text-xs">
          {text.length} / {QUOTE_MAX_LENGTH}
        </Text>
      </View>

      <TextField
        inSheet
        label={t('quotes.pageLabel')}
        value={page}
        onChangeText={setPage}
        keyboardType="number-pad"
        placeholder={t('quotes.pageOptional')}
        error={isPageValid ? undefined : t('quotes.pageError')}
      />

      {add.error ? (
        <Text className="text-center text-danger">{add.error.message}</Text>
      ) : null}

      <Button
        title={t('quotes.save')}
        disabled={text.trim() === '' || !isPageValid}
        loading={add.isPending}
        onPress={save}
      />
    </Sheet>
  );
}
