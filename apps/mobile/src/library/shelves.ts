import { ShelfStatus, type UserBookWithBook } from '@reading/shared';

export interface LibrarySections {
  current: UserBookWithBook | null;
  inProgress: UserBookWithBook[];
  wantToRead: UserBookWithBook[];
  read: UserBookWithBook[];
  readThisYear: number;
}

function newestFirst(date: (book: UserBookWithBook) => string | null) {
  return (a: UserBookWithBook, b: UserBookWithBook) =>
    (date(b) ?? '').localeCompare(date(a) ?? '');
}

// ISO dates sort correctly as plain strings, so no Date parsing is needed
export function toLibrarySections(
  books: UserBookWithBook[],
  now = new Date(),
): LibrarySections {
  const reading = books
    .filter((book) => book.status === ShelfStatus.READING)
    .sort(newestFirst((book) => book.startedAt ?? book.updatedAt));
  const read = books
    .filter((book) => book.status === ShelfStatus.READ)
    .sort(newestFirst((book) => book.finishedAt ?? book.updatedAt));
  const year = String(now.getFullYear());

  return {
    current: reading[0] ?? null,
    inProgress: reading.slice(1),
    wantToRead: books
      .filter((book) => book.status === ShelfStatus.WANT_TO_READ)
      .sort(newestFirst((book) => book.createdAt)),
    read,
    readThisYear: read.filter((book) => book.finishedAt?.startsWith(year))
      .length,
  };
}
