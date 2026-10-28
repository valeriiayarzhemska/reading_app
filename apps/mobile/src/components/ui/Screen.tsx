import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { cn } from '@/lib/cn';
import { useColors } from '@/theme/ThemeProvider';

interface ScreenProps {
  children: ReactNode;
  className?: string;
  // The navigation header already covers the top inset
  edges?: Edge[];
}

export function Screen({
  children,
  className,
  edges = ['bottom'],
}: ScreenProps) {
  const colors = useColors();

  return (
    <LinearGradient
      colors={[colors.backgroundTop, colors.backgroundBottom]}
      style={styles.fill}
    >
      {/* SafeAreaView and LinearGradient are not core components, so they take
          `style`; the inner View takes className */}
      <SafeAreaView edges={edges} style={styles.fill}>
        <View className={cn('flex-1', className)}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
