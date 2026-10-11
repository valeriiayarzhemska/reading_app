import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

interface CardProps extends ViewProps {
  strong?: boolean;
  className?: string;
}

export function Card({ strong = false, className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-card border border-border p-4',
        strong ? 'bg-card-strong' : 'bg-card',
        className,
      )}
      {...props}
    />
  );
}
