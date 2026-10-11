import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { clamp01 } from '@/lib/clamp';
import { COLORS } from '@/theme/colors';

interface ProgressRingProps {
  // 0..1
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}

// The progress stroke is one dash as long as the circumference;
// strokeDashoffset slides it so only `value` of the circle is visible.
export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 4,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamp01(value));
  const center = size / 2;

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clamp01(value) * 100),
      }}
    >
      {/* Rotated -90°: SVG circles start at 3 o'clock, progress starts at 12 */}
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.cardStrong}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.accent}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
