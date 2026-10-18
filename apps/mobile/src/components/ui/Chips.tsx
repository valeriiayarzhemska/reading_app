import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

import { cn } from '@/lib/cn';

export interface ChipOption<T> {
  value: T;
  label: string;
}

interface ChipsProps<T> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
}

// A wrapping row of single-choice chips (years, months)
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: ChipsProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      className={cn('flex-row flex-wrap gap-2', className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'rounded-full border px-4 py-2 active:opacity-70',
              isSelected
                ? 'border-accent-light bg-accent-light'
                : 'border-border bg-card',
            )}
          >
            <Text
              className={cn(
                'font-sans-semibold text-sm',
                isSelected ? 'text-accent-fg' : 'text-fg',
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
