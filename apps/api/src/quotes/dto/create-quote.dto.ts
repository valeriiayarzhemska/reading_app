import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  QUOTE_MAX_LENGTH,
  QUOTE_PAGE_MAX,
  type QuoteInput,
} from '@reading/shared';

export class CreateQuoteDto implements QuoteInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(QUOTE_MAX_LENGTH)
  text: string;

  // Optional: e-books and audiobooks have no pages
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(QUOTE_PAGE_MAX)
  page?: number;
}
