import { View } from 'react-native';

import { Image } from 'expo-image';

import { Text } from '@/components/ui/Text';

interface AvatarProps {
  name: string;
  url: string | null;
  size?: number;
}

// The photo, or a monogram (first letter of the name) until there is one
export function Avatar({ name, url, size = 72 }: AvatarProps) {
  if (url) {
    return (
      <Image
        source={url}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      className="items-center justify-center border border-accent/40 bg-accent/20"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {/* An explicit line height: Lora's default one is shorter than the
          letter, and iOS cuts off its top */}
      <Text
        className="font-serif text-accent-light"
        style={{ fontSize: size * 0.42, lineHeight: size * 0.42 * 1.3 }}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
