import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { clamp01 } from '@/lib/clamp';

interface ProgressBarProps {
  // 0..1
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const percent = Math.round(clamp01(value) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      className={cn(
        'h-1.5 overflow-hidden rounded-full bg-card-strong',
        className,
      )}
    >
      {/* Dynamic width must go in `style`: classes are generated at build time */}
      <View
        className="h-full rounded-full bg-accent"
        style={{ width: `${percent}%` }}
      />
    </View>
  );
}
