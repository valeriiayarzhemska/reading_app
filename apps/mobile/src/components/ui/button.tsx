import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/text';

import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={cn(
        'h-14 overflow-hidden rounded-full active:opacity-80',
        !isPrimary && 'border border-border bg-card-strong',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[COLORS.accentLight, COLORS.accentDark]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <ButtonLabel title={title} loading={loading} isPrimary={isPrimary} />
    </Pressable>
  );
}

function ButtonLabel({
  title,
  loading,
  isPrimary,
}: {
  title: string;
  loading: boolean;
  isPrimary: boolean;
}) {
  const color = isPrimary ? COLORS.accentFg : COLORS.fg;

  return (
    <View className="flex-1 flex-row items-center justify-center gap-2 px-6">
      {loading ? <ActivityIndicator color={color} /> : null}

      <Text
        className={cn(
          'font-sans-bold text-base',
          isPrimary ? 'text-accent-fg' : 'text-fg',
        )}
      >
        {title}
      </Text>
    </View>
  );
}
