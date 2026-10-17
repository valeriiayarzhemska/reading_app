import { View } from 'react-native';

import { Image } from 'expo-image';

import { Text } from '@/components/ui/text';

import { cn } from '@/lib/cn';

const SIZES = {
  xs: { width: 30, height: 44, radius: 4, letter: 'text-sm' },
  sm: { width: 48, height: 70, radius: 6, letter: 'text-xl' },
  md: { width: 80, height: 118, radius: 8, letter: 'text-3xl' },
  lg: { width: 128, height: 188, radius: 12, letter: 'text-5xl' },
} as const;

export type BookCoverSize = keyof typeof SIZES;

interface BookCoverProps {
  uri: string | null;
  // Its first letter is the placeholder when there's no cover
  title: string;
  size?: BookCoverSize;
  className?: string;
}

export function BookCover({
  uri,
  title,
  size = 'sm',
  className,
}: BookCoverProps) {
  const { width, height, radius, letter } = SIZES[size];

  if (uri) {
    return (
      <View className={className}>
        {/* expo-image is not a core component: it takes `style`, not className */}
        <Image
          source={uri}
          style={{ width, height, borderRadius: radius }}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`Cover of ${title}`}
        />
      </View>
    );
  }

  return (
    <View
      style={{ width, height, borderRadius: radius }}
      className={cn(
        'items-center justify-center border border-border bg-card-strong',
        className,
      )}
    >
      <Text className={cn('font-serif text-fg-muted', letter)}>
        {title.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
