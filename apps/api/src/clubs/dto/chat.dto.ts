import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import {
  MESSAGE_MAX_LENGTH,
  type JoinClubPayload,
  type SendMessagePayload,
} from '@reading/shared';

// Socket payloads. Validated inside the gateway's handlers (see there why).

export class JoinClubDto implements JoinClubPayload {
  @IsUUID()
  clubId: string;
}

export class SendMessageDto implements SendMessagePayload {
  @IsUUID()
  clubId: string;

  @IsUUID()
  clientId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(MESSAGE_MAX_LENGTH)
  text: string;
}
