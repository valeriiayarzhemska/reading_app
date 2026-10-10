import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEV_USERS } from '../src/auth/dev-users.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { BOOKS, USER_BOOKS } from './seed-data.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Every step uses upsert, so the seed is safe to run any number of times.
// `update` repeats the data: re-seeding resets these rows to their seed state.
async function main() {
  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: user,
    });
  }

  const books = Object.values(BOOKS);
  // Seed ID → real ID. A Google book may already exist with another ID
  // (imported through the API), so we match it by googleBooksId instead.
  const realBookIds = new Map<string, string>();

  for (const { id, ...book } of books) {
    const data = { ...book, authors: [...book.authors] };
    const where =
      'googleBooksId' in book ? { googleBooksId: book.googleBooksId } : { id };

    const saved = await prisma.book.upsert({
      where,
      create: { id, ...data },
      update: data,
    });

    realBookIds.set(id, saved.id);
  }

  for (const seedUserBook of USER_BOOKS) {
    const userBook = {
      ...seedUserBook,
      bookId: realBookIds.get(seedUserBook.bookId)!,
    };

    await prisma.userBook.upsert({
      where: {
        userId_bookId_format: {
          userId: userBook.userId,
          bookId: userBook.bookId,
          format: userBook.format,
        },
      },
      create: userBook,
      update: userBook,
    });
  }

  console.log(
    `Seeded ${DEV_USERS.length} users, ${books.length} books, ${USER_BOOKS.length} shelf entries`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
