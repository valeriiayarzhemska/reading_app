// "978-0-14-143951-8" → "9780141439518"; null when it's not a valid ISBN.
// The last digit is a checksum, so a typo or a random number is rejected
// instead of becoming a lookup that finds the wrong book.
export function normalizeIsbn(input: string): string | null {
  const isbn = input.replace(/[\s-]/g, '').toUpperCase();

  if (/^\d{13}$/.test(isbn)) {
    return isValidIsbn13(isbn) ? isbn : null;
  }

  // ISBN-10's checksum can be 10, written as "X"
  if (/^\d{9}[\dX]$/.test(isbn)) {
    return isValidIsbn10(isbn) ? isbn : null;
  }

  return null;
}

// Digits weighted 1, 3, 1, 3…; the sum must be divisible by 10
function isValidIsbn13(isbn: string): boolean {
  let sum = 0;

  for (let i = 0; i < 13; i++) {
    sum += Number(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }

  return sum % 10 === 0;
}

// Digits weighted 10, 9, … 1; the sum must be divisible by 11
function isValidIsbn10(isbn: string): boolean {
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    const digit = isbn[i] === 'X' ? 10 : Number(isbn[i]);

    sum += digit * (10 - i);
  }

  return sum % 11 === 0;
}
