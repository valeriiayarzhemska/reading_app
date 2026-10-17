import { z } from 'zod';

import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_PAGE_COUNT_MAX,
  BOOK_TITLE_MAX_LENGTH,
  ShelfStatus,
} from '@reading/shared';

// Messages are translation keys (addBook.errors.*), not text: the schema
// doesn't know the current language, the screen does
export type ManualBookError =
  'required' | 'tooLong' | 'notNumber' | 'pageRange';

const error = (code: ManualBookError) => ({ error: code });

// Inputs hold strings (that's what a TextInput gives); after parsing,
// pageCount is a number or undefined, ready for the API
export const manualBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, error('required'))
    .max(BOOK_TITLE_MAX_LENGTH, error('tooLong')),
  author: z.string().trim().max(BOOK_AUTHOR_MAX_LENGTH, error('tooLong')),
  pageCount: z
    .string()
    .trim()
    .regex(/^\d*$/, error('notNumber'))
    .transform((value) => (value === '' ? undefined : Number(value)))
    .refine(
      (pages) =>
        pages === undefined || (pages >= 1 && pages <= BOOK_PAGE_COUNT_MAX),
      error('pageRange'),
    ),
  // Local file, uploaded only when the form is submitted
  coverUri: z.string().optional(),
  status: z.enum([
    ShelfStatus.WANT_TO_READ,
    ShelfStatus.READING,
    ShelfStatus.READ,
  ]),
});

export type ManualBookValues = z.output<typeof manualBookSchema>;
