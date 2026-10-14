import { randomInt } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// Temporary until onboarding lets the user pick one: "reader_x7k2m9"
export function generateNickname(): string {
  let suffix = '';

  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }

  return `reader_${suffix}`;
}
