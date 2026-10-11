import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

interface ComingSoonProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function ComingSoon({ title, description, children }: ComingSoonProps) {
  return (
    <Screen edges={['top']} className="px-4 pt-2">
      <Text variant="title">{title}</Text>
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text variant="heading">Coming soon</Text>
        <Text variant="muted" className="text-center">
          {description}
        </Text>
        {children}
      </View>
    </Screen>
  );
}
