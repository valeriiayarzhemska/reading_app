import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import {
  CHAT_REACTIONS,
  MESSAGE_MAX_LENGTH,
  type ChatReaction,
  type DeleteMessagePayload,
  type JoinClubPayload,
  type ReactPayload,
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

  // May be empty for a photo; "text or photo" is checked in MessagesService
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(MESSAGE_MAX_LENGTH)
  text: string;

  // Which uploads are allowed is checked in MessagesService
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class ReactDto implements ReactPayload {
  @IsUUID()
  messageId: string;

  @IsIn(CHAT_REACTIONS)
  emoji: ChatReaction;
}

export class DeleteMessageDto implements DeleteMessagePayload {
  @IsUUID()
  messageId: string;
}
