import { bookMatchKey } from '@reading/shared';

interface TitledBook {
  title: string;
  authors: string[];
}

// Picks the candidate that is the same book (same title + first author).
export function findMatchingBook<T extends TitledBook>(
  candidates: T[],
  book: TitledBook,
): T | undefined {
  const key = bookMatchKey(book.title, book.authors);

  return candidates.find(
    (candidate) => bookMatchKey(candidate.title, candidate.authors) === key,
  );
}
