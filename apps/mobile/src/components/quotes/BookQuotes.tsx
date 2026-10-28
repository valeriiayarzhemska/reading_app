import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { BookQuote, UserBookWithBook } from '@reading/shared';

import { AddQuoteSheet } from '@/components/quotes/AddQuoteSheet';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import { Text } from '@/components/ui/Text';

import { useDeleteQuote, useQuotes, useShareQuote } from '@/api/quotes';

// "Quotes" on your book screen: save, share to Shelves, delete
export function BookQuotes({ entry }: { entry: UserBookWithBook }) {
  const { t } = useTranslation();
  const { data: quotes = [] } = useQuotes(entry.id);
  const remove = useDeleteQuote(entry.id);
  const share = useShareQuote();
  const [isAddOpen, setIsAddOpen] = useState(false);

  function confirmShare(quote: BookQuote) {
    Alert.alert(t('quotes.shareTitle'), t('quotes.shareMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('quotes.share'),
        onPress: () =>
          share.mutate(quote.id, {
            onSuccess: () => Alert.alert(t('quotes.shared')),
          }),
      },
    ]);
  }

  function confirmDelete(quote: BookQuote) {
    Alert.alert(t('quotes.deleteTitle'), undefined, [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('quotes.delete'),
        style: 'destructive',
        onPress: () => remove.mutate(quote.id),
      },
    ]);
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">{t('quotes.title')}</Text>

        <Pressable
          onPress={() => setIsAddOpen(true)}
          accessibilityRole="button"
          className="active:opacity-60"
        >
          <Text variant="label" className="text-accent">
            {t('quotes.add')}
          </Text>
        </Pressable>
      </View>

      {quotes.length === 0 ? (
        <Text variant="muted">{t('quotes.empty')}</Text>
      ) : null}

      {quotes.map((quote) => (
        // Long press: delete (a quote is short; editing = delete + add)
        <Pressable
          key={quote.id}
          onLongPress={() => confirmDelete(quote)}
          delayLongPress={300}
        >
          <QuoteCard
            text={quote.text}
            page={quote.page}
            bookTitle={entry.book.title}
            action={
              <Pressable
                onPress={() => confirmShare(quote)}
                disabled={share.isPending}
                className="active:opacity-60"
              >
                <Text className="font-sans-semibold text-sm text-fg-muted">
                  {t('quotes.share')}
                </Text>
              </Pressable>
            }
          />
        </Pressable>
      ))}

      <AddQuoteSheet
        entry={entry}
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </View>
  );
}
