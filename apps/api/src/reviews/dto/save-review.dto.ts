import { Transform } from 'class-transformer';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

import { REVIEW_MAX_LENGTH } from '@reading/shared';

export class SaveReviewDto {
  // Trimmed first: a review of only spaces is empty
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(REVIEW_MAX_LENGTH)
  text: string;

  @IsBoolean()
  hasSpoilers: boolean;
}
