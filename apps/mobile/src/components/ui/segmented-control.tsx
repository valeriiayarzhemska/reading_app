import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn(
        'flex-row rounded-2xl border border-border bg-card p-1',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'flex-1 items-center rounded-xl py-2.5',
              isSelected && 'border border-border bg-card-strong',
            )}
          >
            <Text
              className={cn(
                'text-sm',
                isSelected
                  ? 'font-sans-semibold text-fg'
                  : 'font-sans text-fg-muted',
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
