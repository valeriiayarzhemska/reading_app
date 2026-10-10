import { DEV_USERS } from '../src/auth/dev-users.js';

const [ALICE, BOB] = DEV_USERS;

function googleCover(googleBooksId: string): string {
  return `https://books.google.com/books/content?id=${googleBooksId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// Fixed IDs so re-running the seed updates rows instead of duplicating them.
export const BOOKS = {
  acowar: {
    id: '10000000-0000-4000-8000-000000000001',
    googleBooksId: '9pQQDQAAQBAJ',
    title: 'A Court of Wings and Ruin',
    authors: ['Sarah J. Maas'],
    coverUrl: googleCover('9pQQDQAAQBAJ'),
    pageCount: 828,
    language: 'en',
  },
  acomaf: {
    id: '10000000-0000-4000-8000-000000000002',
    googleBooksId: 'LtEkCwAAQBAJ',
    title: 'A Court of Mist and Fury',
    authors: ['Sarah J. Maas'],
    coverUrl: googleCover('LtEkCwAAQBAJ'),
    pageCount: 745,
    language: 'en',
  },
  acotar: {
    id: '10000000-0000-4000-8000-000000000003',
    googleBooksId: 'E-kdBQAAQBAJ',
    title: 'A Court of Thorns and Roses',
    authors: ['Sarah J. Maas'],
    coverUrl: googleCover('E-kdBQAAQBAJ'),
    pageCount: 486,
    language: 'en',
  },
  acofas: {
    id: '10000000-0000-4000-8000-000000000004',
    googleBooksId: '3wA1DwAAQBAJ',
    title: 'A Court of Frost and Starlight',
    authors: ['Sarah J. Maas'],
    coverUrl: googleCover('3wA1DwAAQBAJ'),
    pageCount: 250,
    language: 'en',
  },
  // Manual books: no Google ID and no cover — the UI must handle this case
  sevenHusbands: {
    id: '10000000-0000-4000-8000-000000000005',
    title: "Сім чоловіків Евелін Г'юго",
    authors: ['Тейлор Дженкінс Рід'],
    pageCount: 400,
    audioDurationMin: 730,
    language: 'uk',
  },
  fourthWing: {
    id: '10000000-0000-4000-8000-000000000006',
    title: 'Четверте крило',
    authors: ['Ребекка Яррос'],
    language: 'uk',
  },
} as const;

export const USER_BOOKS = [
  {
    userId: ALICE.id,
    bookId: BOOKS.acowar.id,
    status: 'READING',
    format: 'PAPER',
    progressUnit: 'PAGES',
    currentProgress: 92,
    startedAt: daysAgo(2),
  },
  {
    userId: ALICE.id,
    bookId: BOOKS.sevenHusbands.id,
    status: 'READING',
    format: 'AUDIO',
    progressUnit: 'PERCENT',
    currentProgress: 43,
    startedAt: daysAgo(10),
  },
  {
    userId: ALICE.id,
    bookId: BOOKS.acofas.id,
    status: 'WANT_TO_READ',
    format: 'PAPER',
    progressUnit: 'PAGES',
  },
  {
    userId: ALICE.id,
    bookId: BOOKS.fourthWing.id,
    status: 'WANT_TO_READ',
    format: 'EBOOK',
    progressUnit: 'PAGES',
  },
  {
    userId: ALICE.id,
    bookId: BOOKS.acotar.id,
    status: 'READ',
    format: 'PAPER',
    progressUnit: 'PAGES',
    currentProgress: 486,
    rating: 10,
    startedAt: daysAgo(40),
    finishedAt: daysAgo(30),
  },
  {
    userId: ALICE.id,
    bookId: BOOKS.acomaf.id,
    status: 'READ',
    format: 'PAPER',
    progressUnit: 'PAGES',
    currentProgress: 745,
    rating: 10,
    startedAt: daysAgo(28),
    finishedAt: daysAgo(9),
  },
  {
    userId: BOB.id,
    bookId: BOOKS.acotar.id,
    status: 'READING',
    format: 'EBOOK',
    progressUnit: 'PERCENT',
    currentProgress: 20,
    startedAt: daysAgo(3),
  },
] as const;
