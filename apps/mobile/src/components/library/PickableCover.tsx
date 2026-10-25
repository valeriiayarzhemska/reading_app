import { Pressable, View } from 'react-native';

import { RemoteImage } from '@/components/ui/RemoteImage';
import { Text } from '@/components/ui/Text';

import { cn } from '@/lib/cn';

const COVER_RATIO = 0.7;

interface PickableCoverProps {
  title: string;
  coverUrl: string | null;
  // Index in the picked list, -1 when not picked
  position: number;
  // The list is full: covers not picked yet can't be tapped
  isFull: boolean;
  onToggle: () => void;
}

// A cover in a 3-column picker grid: tap to pick, the badge shows its place.
// Four favorites and collections.
export function PickableCover({
  title,
  coverUrl,
  position,
  isFull,
  onToggle,
}: PickableCoverProps) {
  const isPicked = position !== -1;

  return (
    <Pressable
      onPress={onToggle}
      disabled={isFull && !isPicked}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isPicked }}
      accessibilityLabel={title}
      style={{ padding: 6 }}
      className={cn('active:opacity-70', isFull && !isPicked && 'opacity-40')}
    >
      <View style={{ aspectRatio: COVER_RATIO }}>
        {coverUrl ? (
          <RemoteImage uri={coverUrl} style={{ flex: 1, borderRadius: 8 }} />
        ) : (
          <View className="flex-1 items-center justify-center rounded-lg border border-border bg-card-strong">
            <Text className="font-serif text-3xl text-fg-muted">
              {title.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {isPicked ? (
          <View
            className="absolute inset-0 rounded-lg border-2 border-accent"
            pointerEvents="none"
          />
        ) : null}

        {isPicked ? (
          <View className="absolute right-1.5 top-1.5 h-7 min-w-7 items-center justify-center rounded-full bg-accent px-1">
            <Text className="font-sans-bold text-sm text-accent-fg">
              {position + 1}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
