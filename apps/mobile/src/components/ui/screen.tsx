import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

interface ScreenProps {
  children: ReactNode;
  className?: string;
  // Which edges need padding for the notch / home indicator. The top is
  // usually handled by the navigation header, so the default is the bottom.
  edges?: Edge[];
}

// Every screen sits on the purple gradient background.
export function Screen({
  children,
  className,
  edges = ['bottom'],
}: ScreenProps) {
  return (
    <LinearGradient
      colors={[COLORS.backgroundTop, COLORS.backgroundBottom]}
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
