import { Pressable, View } from 'react-native';

import { Image } from 'expo-image';

import type { CalendarBook, CalendarDay } from '@reading/shared';

import { Text } from '@/components/ui/Text';

import { cn } from '@/lib/cn';

// The same 7:10 shape as book covers
const CELL_RATIO = 0.7;
// More than two covers in one small cell would be unreadable
const MAX_COVERS = 2;

interface CalendarDayCellProps {
  // null: padding before the 1st / after the last day
  date: string | null;
  day: CalendarDay | undefined;
  isToday: boolean;
  onPress?: (day: CalendarDay) => void;
}

export function CalendarDayCell({
  date,
  day,
  isToday,
  onPress,
}: CalendarDayCellProps) {
  if (!date) {
    return <View className="flex-1" style={{ aspectRatio: CELL_RATIO }} />;
  }

  const books = day ? dayCovers(day) : [];
  const dayNumber = Number(date.slice(8));

  return (
    <Pressable
      onPress={day && onPress ? () => onPress(day) : undefined}
      disabled={!day}
      accessibilityRole={day ? 'button' : undefined}
      accessibilityLabel={date}
      className={cn(
        'flex-1 overflow-hidden rounded-md active:opacity-70',
        isToday && 'border border-accent',
      )}
      style={{ aspectRatio: CELL_RATIO }}
    >
      {books.length > 0 ? (
        <>
          <View className="flex-1 flex-row">
            {books.slice(0, MAX_COVERS).map((book) => (
              <CellCover key={book.userBookId} book={book} />
            ))}
          </View>

          <View className="absolute bottom-0.5 left-0.5 rounded bg-black/55 px-1">
            <Text className="text-[9px] text-white">{dayNumber}</Text>
          </View>

          {/* Books that don't fit as covers; the day sheet lists them all */}
          {books.length > MAX_COVERS ? (
            <View className="absolute right-0.5 top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1">
              <Text className="font-sans-bold text-[9px] text-accent-fg">
                +{books.length - MAX_COVERS}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text
            className={cn('text-xs', isToday ? 'text-accent' : 'text-fg-faint')}
          >
            {dayNumber}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Books finished that day first (the bigger event), then the ones read.
// The same book can be in both lists: read and finished on one day.
function dayCovers(day: CalendarDay): CalendarBook[] {
  const seen = new Set<string>();

  return [...day.finished, ...day.books].filter((book) => {
    if (seen.has(book.userBookId)) {
      return false;
    }

    seen.add(book.userBookId);

    return true;
  });
}

function CellCover({ book }: { book: CalendarBook }) {
  if (book.coverUrl) {
    return (
      <Image
        source={book.coverUrl}
        style={{ flex: 1 }}
        contentFit="cover"
        accessibilityLabel={book.title}
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-card-strong">
      <Text className="font-serif text-sm text-fg-muted">
        {book.title.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
