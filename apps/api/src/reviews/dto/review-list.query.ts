import { IsOptional, IsUUID } from 'class-validator';

export class ReviewListQuery {
  // The id of the last review on the previous page; absent for the first page
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
