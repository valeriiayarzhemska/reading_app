import { TextInput, View, type TextInputProps } from 'react-native';

import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { cssInterop } from 'nativewind';

import { Text } from '@/components/ui/Text';

import { cn } from '@/lib/cn';
import { useColors, useTheme } from '@/theme/ThemeProvider';

// Not a core component, so NativeWind must be told to map className → style
cssInterop(BottomSheetTextInput, { className: 'style' });

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  // Inside a <Sheet>: lets the sheet move up with the keyboard
  inSheet?: boolean;
  className?: string;
}

export function TextField({
  label,
  error,
  inSheet = false,
  className,
  ...inputProps
}: TextFieldProps) {
  const colors = useColors();
  const { scheme } = useTheme();

  const Input = inSheet ? BottomSheetTextInput : TextInput;

  return (
    <View className={cn('gap-1.5', className)}>
      {label ? <Text variant="label">{label}</Text> : null}

      <Input
        className={cn(
          'rounded-2xl border bg-card px-4 py-3.5 font-sans text-base text-fg',
          error ? 'border-danger' : 'border-border',
        )}
        placeholderTextColor={colors.fgFaint}
        selectionColor={colors.accent}
        keyboardAppearance={scheme}
        {...inputProps}
      />

      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
