import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  COLLECTION_BOOKS_MAX,
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_TITLE_MAX,
  type CollectionInput,
} from '@reading/shared';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// The whole collection: creating and editing both send everything
export class SaveCollectionDto implements CollectionInput {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(COLLECTION_TITLE_MAX)
  title: string;

  // null or "" (after trimming): no description
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(COLLECTION_DESCRIPTION_MAX)
  description: string | null;

  // In display order; may be empty while the collection is being filled
  @IsArray()
  @ArrayMaxSize(COLLECTION_BOOKS_MAX)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  bookIds: string[];
}
