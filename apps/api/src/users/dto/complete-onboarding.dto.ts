import { Transform } from 'class-transformer';
import { IsString, Length, Validate } from 'class-validator';

import { DISPLAY_NAME_MAX_LENGTH, normalizeNickname } from '@reading/shared';

import { IsValidNickname } from '../nickname.validator.js';

export class CompleteOnboardingDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, DISPLAY_NAME_MAX_LENGTH)
  displayName: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeNickname(value) : value,
  )
  @Validate(IsValidNickname)
  nickname: string;
}
