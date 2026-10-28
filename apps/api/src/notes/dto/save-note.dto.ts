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
  NOTE_MAX_LENGTH,
  QUOTE_PAGE_MAX,
  type NoteInput,
} from '@reading/shared';

// Creating and editing send the same fields
export class SaveNoteDto implements NoteInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(NOTE_MAX_LENGTH)
  text: string;

  // null or absent: no page (@IsOptional skips validation for null too)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(QUOTE_PAGE_MAX)
  page?: number | null;
}
