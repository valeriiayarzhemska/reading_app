import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';

interface QuoteCardProps {
  text: string;
  page: number | null;
  bookTitle: string;
  // "Share" on your book screen; nothing in the feed
  action?: ReactNode;
}

// «…» in serif, then "— TITLE · p. 294", as in the design
export function QuoteCard({ text, page, bookTitle, action }: QuoteCardProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-2 rounded-2xl border border-border bg-card px-4 pb-3 pt-2">
      <Text className="font-serif text-4xl leading-10 text-fg-faint">«</Text>

      <Text className="font-serif text-lg leading-7">{text}</Text>

      <View className="flex-row items-center justify-between gap-3">
        <Text variant="label" className="flex-1 text-[11px]" numberOfLines={1}>
          — {bookTitle}
          {page !== null ? ` · ${t('quotes.page', { page })}` : ''}
        </Text>

        {action}
      </View>
    </View>
  );
}
