import { Pressable } from 'react-native';

import { Feather } from '@expo/vector-icons';

import { COLORS } from '@/theme/colors';

interface IconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  // Read by screen readers: there is no visible text
  label: string;
  onPress: () => void;
}

// The round outlined button of the chat and room headers
export function IconButton({ icon, label, onPress }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-70"
    >
      <Feather name={icon} size={20} color={COLORS.fg} />
    </Pressable>
  );
}
