import type { ReactNode } from 'react';
import { View } from 'react-native';
import { BookCover } from '@/components/ui/book-cover';
import { Text } from '@/components/ui/text';

interface BookRowProps {
  title: string;
  authors: string[];
  coverUrl: string | null;
  subtitle?: string;
  action?: ReactNode;
}

export function BookRow({
  title,
  authors,
  coverUrl,
  subtitle,
  action,
}: BookRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <BookCover uri={coverUrl} title={title} size="sm" />

      <View className="flex-1">
        <Text className="font-serif text-base" numberOfLines={2}>
          {title}
        </Text>

        <Text variant="muted" numberOfLines={1}>
          {authors.join(', ')}
        </Text>

        {subtitle ? (
          <Text variant="muted" className="mt-0.5 text-xs text-fg-faint">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {action}
    </View>
  );
}
