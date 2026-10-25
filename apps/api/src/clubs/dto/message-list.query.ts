import { IsOptional, IsUUID } from 'class-validator';

export class MessageListQuery {
  // The oldest message of the previous page; absent for the newest page
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
