import type { Prisma } from '../generated/prisma/client.js';

type Tx = Prisma.TransactionClient;

// Call first in a transaction that changes this book's ratings. Two people
// rating at once would otherwise each average without the other's rating:
// FOR UPDATE makes the second transaction wait until the first commits.
export async function lockBook(tx: Tx, bookId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Book" WHERE id = ${bookId} FOR UPDATE`;
}

// Recounts Book.ratingAvg / ratingCount from the shelf entries. Each entry
// counts, so a book rated in two formats by one reader counts twice.
export async function refreshBookRating(
  tx: Tx,
  bookId: string,
): Promise<{ ratingAvg: number | null; ratingCount: number }> {
  const { _avg, _count } = await tx.userBook.aggregate({
    where: { bookId, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return tx.book.update({
    where: { id: bookId },
    data: { ratingAvg: _avg.rating, ratingCount: _count.rating },
    select: { ratingAvg: true, ratingCount: true },
  });
}
