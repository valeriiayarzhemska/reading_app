import type { UserBookWithBook } from '@reading/shared';
import { Pressable, View } from 'react-native';
import { BookCover } from '@/components/ui/book-cover';
import { Text } from '@/components/ui/text';

const STACK_SIZE = 3;

interface ShelfTileProps {
  count: number;
  label: string;
  footer?: string;
  entries: UserBookWithBook[];
  onPress: () => void;
}

export function ShelfTile({
  count,
  label,
  footer,
  entries,
  onPress,
}: ShelfTileProps) {
  const stack = entries.slice(0, STACK_SIZE);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${count} ${label}`}
      className="flex-1 gap-3 rounded-card border border-border bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-baseline gap-2">
        <Text className="font-serif text-4xl">{count}</Text>

        <Text variant="muted">{label}</Text>
      </View>

      <View className="h-[72px] flex-row">
        {stack.map((entry, index) => (
          <View
            key={entry.id}
            // Each cover tucks under the previous one: a fanned stack
            style={{
              marginLeft: index === 0 ? 0 : -22,
              zIndex: STACK_SIZE - index,
            }}
          >
            <BookCover
              uri={entry.book.coverUrl}
              title={entry.book.title}
              size="sm"
            />
          </View>
        ))}
      </View>

      {footer ? (
        <Text variant="muted" className="text-xs" numberOfLines={1}>
          {footer}
        </Text>
      ) : null}
    </Pressable>
  );
}
