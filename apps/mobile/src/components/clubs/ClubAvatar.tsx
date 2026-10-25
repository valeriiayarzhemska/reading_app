import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

interface ClubAvatarProps {
  name: string;
  color: string;
  size?: number;
}

// The room colour chosen on creation, with the name's first letter
export function ClubAvatar({ name, color, size = 52 }: ClubAvatarProps) {
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    >
      {/* Explicit line height, as in Avatar: Lora's own cuts off on iOS */}
      <Text
        className="font-serif text-white"
        style={{ fontSize: size * 0.42, lineHeight: size * 0.42 * 1.3 }}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
