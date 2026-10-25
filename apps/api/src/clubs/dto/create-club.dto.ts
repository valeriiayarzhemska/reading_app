import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  CLUB_COLORS,
  CLUB_DESCRIPTION_MAX,
  CLUB_NAME_MAX,
  type ClubColor,
  type ClubInput,
} from '@reading/shared';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateClubDto implements ClubInput {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(CLUB_NAME_MAX)
  name: string;

  // null or "" (after trimming): no description
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(CLUB_DESCRIPTION_MAX)
  description: string | null;

  // Only the swatches the app offers
  @IsIn(CLUB_COLORS)
  color: ClubColor;
}
