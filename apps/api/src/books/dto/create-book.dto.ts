import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_AUTHORS_MAX_COUNT,
  BOOK_PAGE_COUNT_MAX,
  BOOK_TITLE_MAX_LENGTH,
} from '@reading/shared';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateBookDto {
  @Transform(trim)
  @IsString()
  @Length(1, BOOK_TITLE_MAX_LENGTH)
  title: string;

  // Empty entries are dropped, so ["Austen", ""] saves just "Austen"
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value
          .map((author) =>
            typeof author === 'string' ? author.trim() : author,
          )
          .filter((author) => author !== '')
      : value,
  )
  @IsArray()
  @ArrayMaxSize(BOOK_AUTHORS_MAX_COUNT)
  @IsString({ each: true })
  @Length(1, BOOK_AUTHOR_MAX_LENGTH, { each: true })
  authors?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(BOOK_PAGE_COUNT_MAX)
  pageCount?: number;

  // From POST /uploads/cover; the service checks it's this user's file
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}
