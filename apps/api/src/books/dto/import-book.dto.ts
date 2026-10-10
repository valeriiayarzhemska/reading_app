import { Matches } from 'class-validator';

export class ImportBookDto {
  // Google volume IDs are always 12 chars. Malformed IDs make Google answer
  // 503 instead of 404, so we reject them before calling it.
  @Matches(/^[A-Za-z0-9_-]{12}$/, { message: 'Invalid googleBooksId' })
  googleBooksId: string;
}
