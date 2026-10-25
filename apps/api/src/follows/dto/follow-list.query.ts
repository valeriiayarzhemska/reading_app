import { IsOptional, IsUUID } from 'class-validator';

export class FollowListQuery {
  // The id of the last reader on the previous page; absent for the first page
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
