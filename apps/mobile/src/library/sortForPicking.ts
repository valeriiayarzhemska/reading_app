import { ShelfStatus, type UserBookWithBook } from '@reading/shared';

const STATUS_ORDER: ShelfStatus[] = [
  ShelfStatus.READ,
  ShelfStatus.READING,
  ShelfStatus.WANT_TO_READ,
  ShelfStatus.ABANDONED,
];

// Pickers (favorites, collections) mostly want books you've finished: Read
// first, then the rest. The same book in two formats appears once.
export function sortForPicking(books: UserBookWithBook[]): UserBookWithBook[] {
  const seen = new Set<string>();

  return [...books]
    .sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    )
    .filter((entry) => {
      if (seen.has(entry.bookId)) {
        return false;
      }

      seen.add(entry.bookId);

      return true;
    });
}
