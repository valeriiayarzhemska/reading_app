import { extendTailwindMerge } from 'tailwind-merge';
import { tailwindColors } from '@/theme/colors';

// { fg: { DEFAULT, muted } } → ['fg', 'fg-muted']
function colorNames(colors: Record<string, string | Record<string, string>>) {
  return Object.entries(colors).flatMap(([name, value]) =>
    typeof value === 'string'
      ? [name]
      : Object.keys(value).map((key) =>
          key === 'DEFAULT' ? name : `${name}-${key}`,
        ),
  );
}

// tailwind-merge only knows Tailwind's built-in names; without this it can't
// tell that `font-sans` and `font-sans-bold` or `text-fg` and `text-accent` conflict
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      colors: colorNames(tailwindColors),
      borderRadius: ['card'],
    },
    classGroups: {
      'font-family': [
        {
          font: [
            'serif',
            'serif-semibold',
            'sans',
            'sans-semibold',
            'sans-bold',
          ],
        },
      ],
    },
  },
});

// Later classes win on conflict: cn('text-fg', 'text-accent') → 'text-accent'
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(...classes);
}
