import { normalizeNickname } from '@reading/shared';
import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

export class NicknameAvailabilityQuery {
  // Format problems are reported in the response, not as a 400: the app
  // calls this on every pause in typing
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeNickname(value) : value,
  )
  @IsString()
  @MaxLength(100)
  nickname: string;
}
