import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Validate,
} from 'class-validator';

import {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  LINKS_MAX_COUNT,
  normalizeNickname,
} from '@reading/shared';

import { IsProfileLink } from '../link.validator.js';
import { IsValidNickname } from '../nickname.validator.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, DISPLAY_NAME_MAX_LENGTH)
  displayName?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeNickname(value) : value,
  )
  @Validate(IsValidNickname)
  nickname?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(BIO_MAX_LENGTH)
  bio?: string;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((link) => (typeof link === 'string' ? link.trim() : link))
      : value,
  )
  @IsArray()
  @ArrayMaxSize(LINKS_MAX_COUNT)
  @Validate(IsProfileLink, { each: true })
  links?: string[];
}
