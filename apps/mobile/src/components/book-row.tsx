import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View } from 'react-native';
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
      {coverUrl ? (
        // expo-image is not a core component: it takes `style`, not className
        <Image
          source={coverUrl}
          style={{ width: 48, height: 70, borderRadius: 6 }}
          contentFit="cover"
        />
      ) : (
        // Manual books have no cover: show the first letter instead
        <View className="h-[70px] w-12 items-center justify-center rounded-md bg-card-strong">
          <Text variant="heading">{title.charAt(0)}</Text>
        </View>
      )}

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
