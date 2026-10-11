import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/cn';

// React Native doesn't inherit fonts from parent views like CSS does, so every
// text needs its font set. One component with variants makes that automatic.
const VARIANTS = {
  // Big serif screen titles: "Бібліотека", "Полиці"
  title: 'font-serif text-[32px] leading-[38px] text-fg',
  // Serif section/book titles
  heading: 'font-serif text-xl text-fg',
  body: 'font-sans text-base text-fg',
  muted: 'font-sans text-sm text-fg-muted',
  // Small spaced uppercase labels: "ЗАРАЗ ЧИТАЮ", "ЦІЛІ"
  label: 'font-sans-bold text-[11px] uppercase tracking-[1.5px] text-fg-faint',
} as const;

export type TextVariant = keyof typeof VARIANTS;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({ variant = 'body', className, ...props }: TextProps) {
  return <RNText className={cn(VARIANTS[variant], className)} {...props} />;
}
