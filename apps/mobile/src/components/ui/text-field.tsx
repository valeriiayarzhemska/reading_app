import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function TextField({
  label,
  error,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <View className={cn('gap-1.5', className)}>
      {label ? <Text variant="label">{label}</Text> : null}

      <TextInput
        className={cn(
          'rounded-2xl border bg-card px-4 py-3.5 font-sans text-base text-fg',
          error ? 'border-danger' : 'border-border',
        )}
        placeholderTextColor={COLORS.fgFaint}
        selectionColor={COLORS.accent}
        keyboardAppearance="dark"
        {...inputProps}
      />

      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
