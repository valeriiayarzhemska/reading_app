import { View } from 'react-native';

import { RemoteImage } from '@/components/ui/RemoteImage';
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
      <RemoteImage
        uri={url}
        style={{ width: size, height: size, borderRadius: size / 2 }}
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
        className="font-serif text-accent-text"
        style={{ fontSize: size * 0.42, lineHeight: size * 0.42 * 1.3 }}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
