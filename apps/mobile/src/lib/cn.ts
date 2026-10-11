// Joins class names, skipping empty ones:
// cn('p-4', isActive && 'bg-accent', undefined) → 'p-4 bg-accent'
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
